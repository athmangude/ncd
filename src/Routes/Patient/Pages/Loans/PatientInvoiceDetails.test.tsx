import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import axios from "axios"
import InvoiceDetails from "./PatientInvoiceDetails"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

// Direct visits / refreshes render before the store is populated, so `loan` is
// null. The store selector must be able to yield null without the screen
// dereferencing it (audit §0 — unguarded loan / loan.currency.code).
let mockLoan: unknown = null
vi.mock("../../stores/patientLoanStore", () => ({
  usePatientLoanStore: (sel: (s: { loan: unknown; setLoan: () => void }) => unknown) =>
    sel({ loan: mockLoan, setLoan: () => {} }),
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
      <MemoryRouter initialEntries={["/patients/loans/invoice-details/1"]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("InvoiceDetails crash guards", () => {
  it("renders without crashing when the loan store is empty (direct visit)", async () => {
    // Query succeeds but the store has not been hydrated yet, so `loan` is null.
    vi.mocked(axios.get).mockResolvedValue({ data: {} })
    mockLoan = null

    render(wrap(<InvoiceDetails />))

    expect(
      await screen.findByText("Confirm Treatment Details")
    ).toBeInTheDocument()
    // The unpaid Tag (transactionFeeIsPaid undefined) still renders, no throw.
    expect(screen.getByText("Invoice Details")).toBeInTheDocument()
  })

  it("renders a populated loan without a currency object", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })
    mockLoan = {
      transactionFeeIsPaid: true,
      patientMedicalInfoRequest: {
        healthcareMedicalInfoRequest: {
          invoiceItems: [
            { id: 1, description: "Consultation", totalPrice: "1500" },
          ],
        },
      },
      // no currency — must degrade to a plain amount, not crash
    }

    render(wrap(<InvoiceDetails />))

    // Amount renders via the plain-number fallback (appears as both the line
    // item and the total), proving no crash on the missing currency object.
    expect((await screen.findAllByText("1,500")).length).toBeGreaterThan(0)
  })
})
