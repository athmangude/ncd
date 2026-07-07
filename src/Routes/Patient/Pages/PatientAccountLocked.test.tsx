import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientAccountLocked from "./PatientAccountLocked"

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
    { initialEntries: ["/patients/account-locked"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientAccountLocked content-header migration", () => {
  it("renders the locked message as the single content-header h1", () => {
    render(wrap(<PatientAccountLocked />))

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "This account has been locked.",
    })
    expect(heading).toBeInTheDocument()
  })

  it("shows the title exactly once (no duplicate app-bar + content title)", () => {
    render(wrap(<PatientAccountLocked />))

    expect(screen.getAllByText("This account has been locked.")).toHaveLength(1)
  })

  it("is a root screen — no back button in the app bar", () => {
    render(wrap(<PatientAccountLocked />))

    expect(
      screen.queryByRole("button", { name: /go back/i })
    ).not.toBeInTheDocument()
  })

  it("Back To Dashboard navigates home", async () => {
    render(wrap(<PatientAccountLocked />))

    await userEvent.click(
      screen.getByRole("button", { name: "Back To Dashboard" })
    )
    expect(mockNavigate).toHaveBeenCalledWith("/patients")
  })
})
