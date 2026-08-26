// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { setupServer } from "msw/node"
import { http, HttpResponse, delay } from "msw"
import { notificationsHandlers } from "@/mocks/handlers/notifications"
import careCompanionNotificationsFixture from "@/mocks/fixtures/care-companion-notifications.json"
import { NOTIFICATION_TYPE } from "@/types/care-companion"
import type { CareCompanionNotification } from "@/types/care-companion"

import NotificationFeedPage from "./NotificationFeedPage"

// ---------------------------------------------------------------------------
// Mock useNavigate — keep every other react-router-dom export (MemoryRouter,
// etc.) real so routing context still works, but let us assert exactly what
// path the page navigates to when a notification is tapped.
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom"
    )
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// ---------------------------------------------------------------------------
// MSW server — reuses the real care-companion notification handlers so the
// page is exercised against realistic network behaviour (list, mark-read,
// persistence via the localStorage-backed mock db) rather than module mocks.
// ---------------------------------------------------------------------------

const server = setupServer(...notificationsHandlers)
const ORIGIN = window.location.origin

const fixtureNotifications =
  careCompanionNotificationsFixture as unknown as CareCompanionNotification[]

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
  mockNavigate.mockClear()
})

afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={["/patients/companion/notifications"]}
      >
        <NotificationFeedPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const getBackendNotifications = async () =>
  (
    await fetch(`${ORIGIN}/api/care-companion/notifications`)
  ).json() as Promise<CareCompanionNotification[]>

/** Accessible name the page assigns to a notification's tap target. */
function accessibleName(notification: CareCompanionNotification): string {
  return notification.readAt === null
    ? `Unread: ${notification.title}`
    : notification.title
}

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

      // While loading, neither the empty state nor any notification title has
      // rendered yet.
      expect(
        screen.queryByText("No notifications yet")
      ).not.toBeInTheDocument()

      // Eventually resolves to the empty state.
      expect(
        await screen.findByText("No notifications yet")
      ).toBeInTheDocument()
    })
  })

  describe("all notification types", () => {
    it("renders a card for each of the 7 notification types in the fixture", async () => {
      // Sanity check on the fixture itself: it must cover every notification
      // type the domain supports, otherwise this test would give false
      // confidence.
      const supportedTypes = Object.values(NOTIFICATION_TYPE)
      expect(supportedTypes).toHaveLength(7)
      const fixtureTypes = new Set(fixtureNotifications.map((n) => n.type))
      expect(fixtureTypes.size).toBe(7)
      for (const type of supportedTypes) {
        expect(fixtureTypes.has(type)).toBe(true)
      }

      renderPage()

      // Every fixture notification renders with its title and body visible,
      // and is reachable as a labelled, tappable button.
      for (const notification of fixtureNotifications) {
        expect(
          await screen.findByText(notification.title)
        ).toBeInTheDocument()
        expect(screen.getByText(notification.body)).toBeInTheDocument()
        expect(
          screen.getByRole("button", { name: accessibleName(notification) })
        ).toBeInTheDocument()
      }

      // Exactly one card per fixture notification — no duplicates, nothing
      // dropped. (Excludes the page's "Go back" header button.)
      const notificationCards = screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-label") !== "Go back")
      expect(notificationCards.length).toBe(fixtureNotifications.length)
    })
  })

  describe("tapping a notification", () => {
    it.each(fixtureNotifications)(
      "navigates to $deepLink for the $type notification",
      async (notification) => {
        renderPage()

        const card = await screen.findByRole("button", {
          name: accessibleName(notification),
        })
        await userEvent.click(card)

        expect(mockNavigate).toHaveBeenCalledWith(notification.deepLink)
      }
    )

    it("marks an unread notification as read in the backend when tapped", async () => {
      renderPage()

      const unread = fixtureNotifications.find((n) => n.readAt === null)
      if (!unread) throw new Error("Fixture must contain an unread item")

      const card = await screen.findByRole("button", {
        name: `Unread: ${unread.title}`,
      })
      await userEvent.click(card)

      expect(mockNavigate).toHaveBeenCalledWith(unread.deepLink)

      const backendNotifications = await getBackendNotifications()
      const updated = backendNotifications.find((n) => n.id === unread.id)
      expect(updated?.readAt).not.toBeNull()
    })

    it("navigates without sending a mark-read request for an already-read notification", async () => {
      renderPage()

      const read = fixtureNotifications.find((n) => n.readAt !== null)
      if (!read) throw new Error("Fixture must contain a read item")

      const card = await screen.findByRole("button", { name: read.title })
      await userEvent.click(card)

      expect(mockNavigate).toHaveBeenCalledWith(read.deepLink)

      const backendNotifications = await getBackendNotifications()
      const updated = backendNotifications.find((n) => n.id === read.id)
      // Untouched — mark-read mutation is never fired for already-read items.
      expect(updated?.readAt).toBe(read.readAt)
    })
  })

  describe("unread teal dot indicator", () => {
    it("shows the teal unread dot for every unread notification", async () => {
      renderPage()

      const unreadNotifications = fixtureNotifications.filter(
        (n) => n.readAt === null
      )
      expect(unreadNotifications.length).toBeGreaterThan(0)

      for (const notification of unreadNotifications) {
        const card = await screen.findByRole("button", {
          name: `Unread: ${notification.title}`,
        })
        const dot = card.querySelector("[aria-hidden]")
        expect(dot).not.toBeNull()
        expect(dot).toHaveClass("bg-accent-foreground")
        expect(dot).not.toHaveClass("bg-transparent")
      }
    })
  })

  describe("read notifications do not show the teal dot", () => {
    it("renders a transparent (invisible) dot for every already-read notification", async () => {
      renderPage()

      const readNotifications = fixtureNotifications.filter(
        (n) => n.readAt !== null
      )
      expect(readNotifications.length).toBeGreaterThan(0)

      for (const notification of readNotifications) {
        const card = await screen.findByRole("button", {
          name: notification.title,
        })
        const dot = card.querySelector("[aria-hidden]")
        expect(dot).not.toBeNull()
        expect(dot).toHaveClass("bg-transparent")
        expect(dot).not.toHaveClass("bg-accent-foreground")
      }
    })
  })

  describe("empty state", () => {
    it("renders the empty state when there are no notifications", async () => {
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
      const notificationCards = screen
        .queryAllByRole("button")
        .filter((button) => button.getAttribute("aria-label") !== "Go back")
      expect(notificationCards).toHaveLength(0)
    })

    it("renders the empty state when every notification has sentAt === null (scheduled but not yet delivered)", async () => {
      server.use(
        http.get("/api/care-companion/notifications", () =>
          HttpResponse.json([
            {
              id: "notif-not-sent",
              type: "REFILL_REMINDER",
              title: "Not yet delivered",
              body: "This should never render.",
              deepLink: "/patients/companion",
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
  })

  describe("date grouping", () => {
    it("groups sent notifications into Today, Yesterday, and Earlier sections in order", async () => {
      // Fixed "now" so Today/Yesterday/Earlier grouping is deterministic and
      // matches the fixture's fixed scheduledAt values, regardless of the
      // host machine's timezone or the actual date the suite runs on.
      vi.useFakeTimers({ toFake: ["Date"] })
      vi.setSystemTime(new Date("2026-08-25T12:00:00Z"))

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

      const sections = screen.getAllByRole("region")
      expect(sections).toEqual([todaySection, yesterdaySection, earlierSection])
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

      const retryButton = await screen.findByRole("button", {
        name: "Try again",
      })
      shouldFail = false
      await userEvent.click(retryButton)

      expect(
        await screen.findByText("No notifications yet")
      ).toBeInTheDocument()
    })
  })
})
