import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientFavoriteCareProviders from "./PatientFavoriteCareProviders"

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
      nextRoute: "/patients/healthcare-focus",
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
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/select-favorite-care-providers"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientFavoriteCareProviders footer migration", () => {
  it("renders the dual-action footer with Skip and a disabled Next (no providers)", () => {
    render(wrap(<PatientFavoriteCareProviders />))

    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("Skip triggers skipStep", async () => {
    render(wrap(<PatientFavoriteCareProviders />))

    await userEvent.click(screen.getByRole("button", { name: "Skip" }))
    expect(skipStep).toHaveBeenCalledTimes(1)
    expect(submitStep).not.toHaveBeenCalled()
  })
})
