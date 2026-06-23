import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import axios from "axios"
import { PatientIdVerificationOnboarding } from "./PatientIdVerificationOnboarding"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("../../hooks/useNextOnboardingStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextOnboardingStep")>()
  return { ...actual, default: () => "/patients/create-pin" }
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
  vi.clearAllMocks()
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
      { initialEntries: ["/patients/id-verification-onboarding"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientIdVerificationOnboarding footer migration", () => {
  it("renders Skip and a Submit disabled until an ID is entered", async () => {
    render(wrap(<PatientIdVerificationOnboarding />))

    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled()
  })

  it("Skip navigates to the next step", async () => {
    render(wrap(<PatientIdVerificationOnboarding />))

    await userEvent.click(screen.getByRole("button", { name: "Skip" }))
    expect(mockNavigate).toHaveBeenCalledWith("/patients/create-pin")
  })

  it("Submit posts the ID number via the footer button", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { ok: true } })

    render(wrap(<PatientIdVerificationOnboarding />))

    await userEvent.type(screen.getByPlaceholderText("12345678"), "87654321")
    await userEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/patients/verify-id-number"),
        { idNumber: "87654321" }
      )
    })
  })
})
