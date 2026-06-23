import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import InviteTextPage from "./InviteTextPage"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: null }) => unknown) =>
    sel({ user: null }),
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
  localStorage.clear()
})

function wrap(ui: ReactNode) {
  return createElement(
    MemoryRouter,
    { initialEntries: ["/patients/network/invite-text"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("InviteTextPage footer migration", () => {
  it("renders the CTA in the footer, disabled until a message is typed", async () => {
    render(wrap(<InviteTextPage />))

    const cta = screen.getByRole("button", { name: /Preview your invite/i })
    expect(cta).toBeDisabled()

    await userEvent.type(screen.getByRole("textbox"), "Join my circle")
    expect(cta).toBeEnabled()
  })
})
