import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientHealthcareFocus from "./PatientHealthcareFocus"

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
      nextRoute: "/patients/ncd-status",
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
    { initialEntries: ["/patients/healthcare-focus"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientHealthcareFocus footer migration", () => {
  it("renders the dual-action footer with Skip and a disabled Next", () => {
    render(wrap(<PatientHealthcareFocus />))

    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("Skip triggers skipStep", async () => {
    render(wrap(<PatientHealthcareFocus />))

    await userEvent.click(screen.getByRole("button", { name: "Skip" }))
    expect(skipStep).toHaveBeenCalledTimes(1)
  })

  it("enables Next once a focus area is selected and submits the areas", async () => {
    render(wrap(<PatientHealthcareFocus />))

    // The CheckboxItem label is now associated with its checkbox (htmlFor→id),
    // so clicking the label text toggles the option.
    await userEvent.click(screen.getByText(/Maternity & Newborn Care/i))

    const next = screen.getByRole("button", { name: "Next" })
    expect(next).toBeEnabled()

    await userEvent.click(next)
    expect(submitStep).toHaveBeenCalledWith({
      focusAreas: ["MATERNITY_NEWBORN_CARE"],
    })
  })
})
