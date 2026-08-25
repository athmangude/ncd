// @vitest-environment jsdom
import { createElement, type ReactNode } from "react"
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { render, screen, within, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { setupServer } from "msw/node"
import { http, HttpResponse, delay } from "msw"
import { notificationsHandlers } from "@/mocks/handlers/notifications"

import NotificationFeedPage from "./NotificationFeedPage"

// ---------------------------------------------------------------------------
// MSW server — reuses the real care-companion notification handlers so the
// page is exercised against realistic network behaviour (list, mark-read,
// persistence via the localStorage-backed mock db) rather than module mocks.
// ---------------------------------------------------------------------------

const server = setupServer(...notificationsHandlers)
const ORIGIN = window.location.origin

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
  // Fixed "now" so Today/Yesterday/Earlier grouping is deterministic and
  // matches the fixture's fixed scheduledAt values, regardless of the host
  // machine's timezone or the actual date the test suite runs on.
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-08-25T12:00:00Z"))
})

afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderPage(initialPath = "/patients/care-companion/notifications") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MemoryRouter,
        { initialEntries: [initialPath] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/patients/care-companion/notifications",
            element: createElement(NotificationFeedPage),
          }),
          createElement(Route, {
            path: "/patients/care-companion/refill-schedule",
            element: createElement("div", null, "Refill Schedule Page"),
          }),
          createElement(Route, {
            path: "/patients/care-companion/medication-loan",
            element: createElement("div", null, "Medication Loan Page"),
          }),
          createElement(Route, {
            path: "/patients/care-companion/education",
            element: createElement("div", null, "Education Page"),
          }),
          createElement(Route, {
            path: "/patients/care-companion",
            element: createElement("div", null, "Care Companion Home"),
          })
        )
      )
    ) as ReactNode
  )
}

const getNotifications = async () =>
  (
    await fetch(`${ORIGIN}/api/care-companion/notifications`)
  ).json() as Promise<{ id: string; readAt: string | null }[]>

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationFeedPage", () => {
  describe("loading state", () => {
    it("shows the notifications skeleton while the request is in flight", async () => {
      server.use(
        http.get("/api/care-companion/notifications", async () => {
          await delay(50)
          return HttpResponse.json([])
        })
      )

      renderPage()

      // While loading, neither the empty state nor any group heading has
      // rendered yet.
      expect(screen.queryByText("No notifications yet")).not.toBeInTheDocument()
      expect(
        screen.queryByRole("heading", { name: "Today" })
      ).not.toBeInTheDocument()

      // Eventually resolves to the empty state.
      expect(
        await screen.findByText("No notifications yet")
      ).toBeInTheDocument()
    })
  })

  describe("happy path — grouped feed", () => {
    it("groups sent notifications into Today, Yesterday, and Earlier sections in order", async () => {
      renderPage()

      const todaySection = await screen.findByRole("region", {
        name: "Today notifications",
      })
      const yesterdaySection = screen.getByRole("region", {
        name: "Yesterday notifications",
      })
      const earlierSection = screen.getByRole("region", {
        name: "Earlier notifications",
      })

      // Order in the DOM: Today, then Yesterday, then Earlier.
      const sections = screen.getAllByRole("region")
      expect(sections).toEqual([todaySection, yesterdaySection, earlierSection])

      // Today: the two notifications scheduled on 2026-08-25.
      expect(
        within(todaySection).getByText("Metformin 500mg refill due soon")
      ).toBeInTheDocument()
      expect(
        within(todaySection).getByText(
          "This week: Managing blood sugar with local foods"
        )
      ).toBeInTheDocument()

      // Yesterday: the lab reminder scheduled on 2026-08-24.
      expect(
        within(yesterdaySection).getByText("HbA1c test due this month")
      ).toBeInTheDocument()

      // Earlier: everything scheduled before 2026-08-24.
      expect(
        within(earlierSection).getByText("Aspirin 75mg refill overdue")
      ).toBeInTheDocument()
      expect(
        within(earlierSection).getByText(
          "Medication loan available for Aspirin 75mg"
        )
      ).toBeInTheDocument()
      expect(
        within(earlierSection).getByText(
          "Pre-approved credit for upcoming refills"
        )
      ).toBeInTheDocument()
      expect(
        within(earlierSection).getByText(
          "New medication card: Amlodipine 5mg"
        )
      ).toBeInTheDocument()
    })

    it("marks unread notifications with an accessible 'Unread:' label and read ones without it", async () => {
      renderPage()

      // Unread fixture entry.
      expect(
        await screen.findByRole("button", {
          name: "Unread: Metformin 500mg refill due soon",
        })
      ).toBeInTheDocument()

      // Already-read fixture entry — no "Unread:" prefix.
      expect(
        screen.getByRole("button", {
          name: "Aspirin 75mg refill overdue",
        })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole("button", {
          name: "Unread: Aspirin 75mg refill overdue",
        })
      ).not.toBeInTheDocument()
    })
  })

  describe("tapping a notification", () => {
    it("marks an unread notification as read and navigates to its deep link", async () => {
      renderPage()

      const card = await screen.findByRole("button", {
        name: "Unread: Metformin 500mg refill due soon",
      })
      fireEvent.click(card)

      // Navigates to the deep link route.
      expect(
        await screen.findByText("Refill Schedule Page")
      ).toBeInTheDocument()

      // The mark-read PATCH was sent and persisted in the mock backend.
      const notifications = await getNotifications()
      const updated = notifications.find(
        (n) => n.id === "notif-refill-reminder-001"
      )
      expect(updated?.readAt).not.toBeNull()
    })

    it("navigates to the deep link without changing readAt for an already-read notification", async () => {
      renderPage()

      const card = await screen.findByRole("button", {
        name: "Aspirin 75mg refill overdue",
      })
      fireEvent.click(card)

      expect(
        await screen.findByText("Refill Schedule Page")
      ).toBeInTheDocument()

      const notifications = await getNotifications()
      const updated = notifications.find(
        (n) => n.id === "notif-refill-overdue-001"
      )
      // Untouched — mark-read mutation is never fired for already-read items.
      expect(updated?.readAt).toBe("2026-08-20T08:15:00Z")
    })

    it("navigates to the medication loan deep link for the loan-offer notification", async () => {
      renderPage()

      const card = await screen.findByRole("button", {
        name: "Unread: Medication loan available for Aspirin 75mg",
      })
      fireEvent.click(card)

      expect(
        await screen.findByText("Medication Loan Page")
      ).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("filters out notifications with sentAt === null (scheduled but not yet delivered)", async () => {
      server.use(
        http.get("/api/care-companion/notifications", () =>
          HttpResponse.json([
            {
              id: "notif-not-sent",
              type: "REFILL_REMINDER",
              title: "Not yet delivered",
              body: "This should never render.",
              deepLink: "/patients/care-companion",
              scheduledAt: "2026-08-25T06:00:00Z",
              sentAt: null,
              readAt: null,
              metadata: null,
            },
          ])
        )
      )

      renderPage()

      expect(
        await screen.findByText("No notifications yet")
      ).toBeInTheDocument()
      expect(screen.queryByText("Not yet delivered")).not.toBeInTheDocument()
    })

    it("shows the empty state when there are no notifications at all", async () => {
      server.use(
        http.get("/api/care-companion/notifications", () =>
          HttpResponse.json([])
        )
      )

      renderPage()

      expect(
        await screen.findByText("No notifications yet")
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          "When you have refill reminders, education tips, or loan offers they will appear here."
        )
      ).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("shows an error message with a retry action when the request fails", async () => {
      server.use(
        http.get("/api/care-companion/notifications", () =>
          HttpResponse.json({ error: "Server error" }, { status: 500 })
        )
      )

      renderPage()

      expect(
        await screen.findByText(
          "We couldn't load your notifications. Check your connection and try again."
        )
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument()
    })

    it("reloads the feed when Try again succeeds after a failure", async () => {
      let shouldFail = true
      server.use(
        http.get("/api/care-companion/notifications", () => {
          if (shouldFail) {
            return HttpResponse.json({ error: "Server error" }, { status: 500 })
          }
          return HttpResponse.json([])
        })
      )

      renderPage()

      await screen.findByRole("button", { name: "Try again" })
      shouldFail = false
      fireEvent.click(screen.getByRole("button", { name: "Try again" }))

      expect(
        await screen.findByText("No notifications yet")
      ).toBeInTheDocument()
    })
  })
})
