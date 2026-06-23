import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientNCDStatus from "./PatientNCDStatus"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { submitStep, skipStep } = vi.hoisted(() => ({
  submitStep: vi.fn(),
  skipStep: vi.fn(),
}))

let isSubmitting = false

vi.mock("../../hooks/useNextCareProfileStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextCareProfileStep")>()
  return {
    ...actual,
    default: () => ({
      nextRoute: "/patients/care-profile-success",
      submitStep,
      skipStep,
      isSubmitting,
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
  isSubmitting = false
})

function wrap(ui: ReactNode) {
  return createElement(
    MemoryRouter,
    { initialEntries: ["/patients/ncd-status"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientNCDStatus footer migration", () => {
  it("renders the dual-action footer with Skip and a disabled Submit", () => {
    render(wrap(<PatientNCDStatus />))

    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled()
  })

  it("Skip triggers skipStep", async () => {
    render(wrap(<PatientNCDStatus />))

    await userEvent.click(screen.getByRole("button", { name: "Skip" }))
    expect(skipStep).toHaveBeenCalledTimes(1)
  })

  it("enables Submit after a choice and submits the NCD status", async () => {
    render(wrap(<PatientNCDStatus />))

    await userEvent.click(screen.getByText("Yes, I do"))

    const submit = screen.getByRole("button", { name: "Submit" })
    expect(submit).toBeEnabled()

    await userEvent.click(submit)
    expect(submitStep).toHaveBeenCalledWith({ ncdStatus: "YES" })
  })
})
