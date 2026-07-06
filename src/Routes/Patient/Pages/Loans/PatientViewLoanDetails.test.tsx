import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import axios from "axios"
import ViewLoanDetails from "./PatientViewLoanDetails"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

vi.mock("../../stores/patientLoanStore", () => ({
  usePatientLoanStore: (sel: (s: { loan: unknown; setLoan: () => void }) => unknown) =>
    sel({ loan: null, setLoan: () => {} }),
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { LOAN_REPAYMENT: { LOAN_DETAILS_VIEW: "view" } },
}))
vi.mock("@/analytics/metadata", () => ({ safeAmount: (n: unknown) => n }))

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
      <MemoryRouter initialEntries={["/patients/loans/loan-details/1"]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// The ADVANCE branch previously read currency.code unguarded; a loan payload
// without a currency object must degrade to the "KES" fallback, not crash
// (comprehensive audit, findings §0).
describe("ViewLoanDetails crash guards", () => {
  it("renders an ADVANCE loan with no currency object without crashing", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        amount: 5000,
        totalBillAmount: 5000,
        outstandingAmount: 5000,
        loanType: "ADVANCE",
        status: "ACTIVE",
        createdAt: "2026-01-01T10:00:00Z",
        loanDueDate: "2026-02-01T10:00:00Z",
        transactions: [],
        patientMedicalInfoRequest: {
          patientName: "Amina",
          facility: { name: "Aga Khan Hospital" },
        },
        // no currency
      },
    })

    render(wrap(<ViewLoanDetails />))

    // The screen mounts (past the ADVANCE currency.code deref) and shows its
    // header rather than crashing into the error boundary.
    expect(await screen.findByText("Loan details")).toBeInTheDocument()
    // Amount renders via the "KES" fallback (formatted, may be split/repeated).
    expect((await screen.findAllByText(/5,000/)).length).toBeGreaterThan(0)
  })
})
