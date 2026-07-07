import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { CircleActivityBanner } from "./CircleActivityBanner"
import { createElement, type ReactNode } from "react"

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(MemoryRouter, null, ui)
  )

const member = {
  id: "b",
  firstName: "Brian",
  lastName: "K",
  avatarUrl: null,
}

describe("CircleActivityBanner", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("renders the SET_UP_CIRCLE empty-state banner as a secondary Button", () => {
    render(wrap(<CircleActivityBanner banner={{ variant: "SET_UP_CIRCLE" }} />))
    const button = screen.getByTestId("set-up-circle-banner")
    expect(button).toBeInTheDocument()
    // migrated to <Button variant="secondary"> — no per-call purple palette
    expect(button).toHaveClass("bg-secondary")
    expect(button.className).not.toMatch(/bg-purple-\d/)
    expect(screen.getByText("Set up your Circle")).toBeInTheDocument()
  })

  it("renders 'joined your Circle' copy with green tint", () => {
    render(
      wrap(
        <CircleActivityBanner banner={{ variant: "MEMBER_JOINED", member }} />
      )
    )
    expect(screen.getByText(/Brian joined your Circle/i)).toBeInTheDocument()
    const banner = screen.getByTestId("joined-banner")
    expect(banner).toHaveClass("bg-green-50")
    expect(banner).toHaveClass("border-green-100")
    expect(screen.getByTestId("banner-dot")).toHaveClass("bg-green-500")
  })

  it("renders 'has left your Circle' copy with red tint", () => {
    render(
      wrap(
        <CircleActivityBanner
          banner={{
            variant: "MEMBER_LEFT",
            member,
            stillQualifies: false,
            eventId: "evt-1",
          }}
        />
      )
    )
    expect(screen.getByText(/Brian has left your Circle/i)).toBeInTheDocument()
    const banner = screen.getByTestId("left-banner")
    expect(banner).toHaveClass("bg-red-50")
    expect(banner).toHaveClass("border-red-100")
    expect(screen.getByTestId("banner-dot")).toHaveClass("bg-red-500")
  })

  it("renders the pending-invites pill with pluralised copy", () => {
    render(
      wrap(
        <CircleActivityBanner
          banner={{ variant: "PENDING_INVITES", count: 2 }}
        />
      )
    )
    expect(
      screen.getByRole("button", { name: /Send reminders to 2 people/i })
    ).toBeInTheDocument()
  })

  it("singularises to 1 person", () => {
    render(
      wrap(
        <CircleActivityBanner
          banner={{ variant: "PENDING_INVITES", count: 1 }}
        />
      )
    )
    expect(
      screen.getByRole("button", { name: /Send reminders to 1 person/i })
    ).toBeInTheDocument()
  })

  it("fires the send-reminders mutation on click", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sent: 2, throttled: false }),
    })
    vi.stubGlobal("fetch", fetchMock)
    render(
      wrap(
        <CircleActivityBanner
          banner={{ variant: "PENDING_INVITES", count: 2 }}
        />
      )
    )
    fireEvent.click(
      screen.getByRole("button", { name: /Send reminders to 2 people/i })
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/patient-network/invites/send-reminders"
    )
  })
})
