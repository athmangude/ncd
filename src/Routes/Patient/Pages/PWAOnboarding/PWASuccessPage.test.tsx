import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PWASuccessPage from "./PWASuccessPage"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { PWA_INSTALL: { SUCCESS_PAGE_VIEW: "pwa_success_view" } },
}))

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

function wrap(ui: ReactNode) {
  return createElement(
    MemoryRouter,
    { initialEntries: ["/patients/pwa-success"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PWASuccessPage content-header migration", () => {
  it("renders the success title as the single content-header h1", () => {
    render(wrap(<PWASuccessPage />))

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "You're all set!",
    })
    expect(heading).toBeInTheDocument()
  })

  it("shows the title exactly once (no duplicate header title)", () => {
    render(wrap(<PWASuccessPage />))

    expect(screen.getAllByText("You're all set!")).toHaveLength(1)
  })

  it("dashboard CTA navigates home from the footer", async () => {
    render(wrap(<PWASuccessPage />))

    await userEvent.click(
      screen.getByRole("button", { name: /Take me to my dashboard/i })
    )
    expect(mockNavigate).toHaveBeenCalledWith("/patients")
  })
})
