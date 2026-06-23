import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientIdPhotoGuide from "./PatientIdPhotoGuide"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: Record<string, unknown> }) => unknown
  ) => sel({ user: {} }),
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
  mockNavigate.mockClear()
})

function wrap(ui: ReactNode) {
  return createElement(
    MemoryRouter,
    { initialEntries: ["/patients/id-photo-guide"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientIdPhotoGuide footer migration", () => {
  it("renders the Back CTA in the footer", () => {
    render(wrap(<PatientIdPhotoGuide />))
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
  })

  it("Back navigates to the previous page", async () => {
    render(wrap(<PatientIdPhotoGuide />))
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
