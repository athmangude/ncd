import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import CareProfileSuccess from "./CareProfileSuccess"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

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
    { initialEntries: ["/patients/care-profile-success"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CareProfileSuccess content-header migration", () => {
  it("renders the success title as the single content-header h1", () => {
    render(wrap(<CareProfileSuccess />))

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Jireh profile complete!",
    })
    expect(heading).toBeInTheDocument()
  })

  it("shows the title exactly once (no duplicate header title)", () => {
    render(wrap(<CareProfileSuccess />))

    expect(screen.getAllByText("Jireh profile complete!")).toHaveLength(1)
  })

  it("dashboard CTA navigates home from the footer", async () => {
    render(wrap(<CareProfileSuccess />))

    await userEvent.click(
      screen.getByRole("button", { name: /Go to my dashboard/i })
    )
    expect(mockNavigate).toHaveBeenCalledWith("/patients/")
  })
})
