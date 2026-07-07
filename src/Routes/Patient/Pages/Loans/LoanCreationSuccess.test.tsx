import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import axios from "axios"
import LoanCreationSuccess from "./LoanCreationSuccess"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

vi.mock("../../hooks/useNextLoanApplicationStep", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../hooks/useNextLoanApplicationStep")
    >()
  return { ...actual, default: () => "/patients" }
})

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
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter
        initialEntries={["/patients/loans/loan-application-success"]}
      >
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// Direct visits/refreshes can land here with an incomplete loan payload (no
// currency object) — the screen must degrade to a plain amount, not crash
// into the error boundary (comprehensive audit, findings §0).
describe("LoanCreationSuccess crash guards", () => {
  it("renders the submitted-for-approval view without a currency", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        status: "SUBMITTED_FOR_APPROVAL",
        totalBillAmount: 5000,
        careProvider: { name: "Aga Khan Hospital" },
      },
    })

    render(wrap(<LoanCreationSuccess />))

    expect(
      await screen.findByText("Your Payment Has Been Submitted For Approval")
    ).toBeInTheDocument()
    expect(screen.getByText("5,000")).toBeInTheDocument()
  })

  it("renders the disbursed view without a currency", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        status: "DISBURSED",
        totalBillAmount: 7500,
        updatedAt: "2026-01-01T10:00:00Z",
        careProvider: { name: "Aga Khan Hospital" },
        patientMedicalInfoRequest: { patientName: "Amina" },
      },
    })

    render(wrap(<LoanCreationSuccess />))

    expect(await screen.findByText("Payment Successful!")).toBeInTheDocument()
    expect(screen.getByText("7,500")).toBeInTheDocument()
  })
})
