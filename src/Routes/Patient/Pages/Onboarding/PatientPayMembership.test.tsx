import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import axios from "axios"
import PatientPayMembership from "./PatientPayMembership"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("../../hooks/useNextKYCStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextKYCStep")>()
  return { ...actual, default: () => "/patients" }
})

vi.mock("@/hooks/useOfflinePatientData", () => ({
  useOfflinePatientData: () => ({ data: undefined }),
}))

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: Record<string, unknown>; setUser: () => void }) => unknown
  ) => sel({ user: {}, setUser: () => {} }),
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
      { initialEntries: ["/patients/pay-membership"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientPayMembership footer migration", () => {
  it("renders Later and Pay actions in the footer", () => {
    render(wrap(<PatientPayMembership />))

    expect(screen.getByRole("button", { name: "Later" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Pay KES 499/i })
    ).toBeInTheDocument()
  })

  it("Later navigates to the next step without paying", async () => {
    render(wrap(<PatientPayMembership />))

    await userEvent.click(screen.getByRole("button", { name: "Later" }))
    expect(mockNavigate).toHaveBeenCalledWith("/patients", expect.anything())
    expect(axios.post).not.toHaveBeenCalled()
  })

  it("Pay submits the plan details", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: {} })

    render(wrap(<PatientPayMembership />))

    await userEvent.click(screen.getByRole("button", { name: /Pay KES 499/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/patients/submit-plan-details"),
        { plan: "JIREH_PLUS" }
      )
    })
  })
})
