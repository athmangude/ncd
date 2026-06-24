import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientSelectInsurance from "./PatientSelectInsurance"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { submitStep, skipStep } = vi.hoisted(() => ({
  submitStep: vi.fn(),
  skipStep: vi.fn(),
}))

vi.mock("../../hooks/useNextCareProfileStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextCareProfileStep")>()
  return {
    ...actual,
    default: () => ({
      nextRoute: "/patients/select-favorite-care-providers",
      submitStep,
      skipStep,
      isSubmitting: false,
      error: null,
    }),
  }
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
  submitStep.mockClear()
  skipStep.mockClear()
  localStorage.clear()
})

function wrap(ui: ReactNode) {
  return createElement(
    MemoryRouter,
    { initialEntries: ["/patients/select-Insurance"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientSelectInsurance footer migration", () => {
  it("renders the dual-action footer with Skip and Submit", () => {
    render(wrap(<PatientSelectInsurance />))

    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled()
  })

  it("Skip triggers skipStep without submitting", async () => {
    render(wrap(<PatientSelectInsurance />))

    await userEvent.click(screen.getByRole("button", { name: "Skip" }))
    expect(skipStep).toHaveBeenCalledTimes(1)
    expect(submitStep).not.toHaveBeenCalled()
  })

  it("Submit triggers submitStep", async () => {
    render(wrap(<PatientSelectInsurance />))

    await userEvent.click(screen.getByRole("button", { name: "Submit" }))
    expect(submitStep).toHaveBeenCalledTimes(1)
  })
})
