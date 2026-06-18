import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { CircleStatusSection } from "./CircleStatusSection"
import { createElement, type ReactNode } from "react"

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(MemoryRouter, null, ui),
  )

function stubFetch(handlers: {
  network: () => Promise<unknown>
  activity: () => Promise<unknown>
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/circle-activity")) {
        try {
          const body = await handlers.activity()
          return { ok: true, json: async () => body }
        } catch (e) {
          return { ok: false, status: 500, text: async () => String(e) }
        }
      }
      const body = await handlers.network()
      return { ok: true, json: async () => body }
    }),
  )
}

describe("CircleStatusSection", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("renders header + See all link when a circle exists", async () => {
    stubFetch({
      network: async () => ({
        network: [{ id: "a", firstName: "A", lastName: "B", profilePhoto: null }],
        invites: [],
        slots: {
          accountable: { used: 1, reserved: 0, max: 3 },
          auxiliary: { used: 0, reserved: 0, max: 2 },
        },
      }),
      activity: async () => ({ events: [] }),
    })
    render(wrap(<CircleStatusSection />))
    await waitFor(() => expect(screen.getByText("Your Circle")).toBeInTheDocument())
    expect(screen.getByRole("link", { name: /See all/i })).toHaveAttribute(
      "href",
      "/patients/circle",
    )
  })

  it("does not render a banner in neutral state", async () => {
    stubFetch({
      network: async () => ({
        network: [],
        invites: [],
        slots: {
          accountable: { used: 0, reserved: 0, max: 3 },
          auxiliary: { used: 0, reserved: 0, max: 2 },
        },
      }),
      activity: async () => ({ events: [] }),
    })
    render(wrap(<CircleStatusSection />))
    await waitFor(() => expect(screen.getByText("Your Circle")).toBeInTheDocument())
    expect(screen.queryByText(/joined your Circle/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/has left your Circle/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Send reminders/i }),
    ).not.toBeInTheDocument()
  })

  it("renders nothing when the patient has no circle (slots undefined)", async () => {
    stubFetch({
      network: async () => ({ network: [], invites: [], slots: undefined }),
      activity: async () => ({ events: [] }),
    })
    const { container } = render(wrap(<CircleStatusSection />))
    await waitFor(() => expect(container.firstChild).toBeNull())
  })

  it("suppresses banner silently when /circle-activity errors", async () => {
    stubFetch({
      network: async () => ({
        network: [{ id: "a", firstName: "A", lastName: "B", profilePhoto: null }],
        invites: [],
        slots: {
          accountable: { used: 1, reserved: 0, max: 3 },
          auxiliary: { used: 0, reserved: 0, max: 2 },
        },
      }),
      activity: async () => {
        throw new Error("boom")
      },
    })
    render(wrap(<CircleStatusSection />))
    await waitFor(() => expect(screen.getByText("Your Circle")).toBeInTheDocument())
    expect(screen.queryByText(/joined your Circle/i)).not.toBeInTheDocument()
  })
})
