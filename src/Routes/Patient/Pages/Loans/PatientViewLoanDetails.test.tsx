import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import axios from "axios"
import ViewLoanDetails, {
  MedicalRequestDetails,
} from "./PatientViewLoanDetails"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

// Mutable so individual tests can hydrate the store (MedicalRequestDetails
// reads `loan.status` off it). Defaults to null for the direct-visit path.
let mockLoan: unknown = null
vi.mock("../../stores/patientLoanStore", () => ({
  usePatientLoanStore: (sel: (s: { loan: unknown; setLoan: () => void }) => unknown) =>
    sel({ loan: mockLoan, setLoan: () => {} }),
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
  mockLoan = null
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

// MedicalRequestDetails previously always rendered a status <Tag>; with an
// undefined status formatEnum returned "" → an empty grey pill (audit §0
// rendered-broken). The Tag must now be omitted entirely when status is absent.
describe("MedicalRequestDetails status pill", () => {
  it("omits the status Tag when the loan has no status", () => {
    mockLoan = {
      status: undefined,
      patientMedicalInfoRequest: {
        patientName: "Amina",
        facility: { name: "Aga Khan Hospital" },
      },
    }

    render(wrap(<MedicalRequestDetails />))

    // Facility name still renders…
    const facility = screen.getByText("Aga Khan Hospital")
    expect(facility).toBeInTheDocument()
    // …but there is no status pill: the header row holds only the facility h1.
    const headerRow = facility.parentElement
    expect(headerRow?.children.length).toBe(1)
  })

  it("renders the status Tag when the loan has a status", () => {
    mockLoan = {
      status: "ACTIVE",
      patientMedicalInfoRequest: {
        patientName: "Amina",
        facility: { name: "Aga Khan Hospital" },
      },
    }

    render(wrap(<MedicalRequestDetails />))

    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
  })
})
