import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import PatientInsurancePayForCover from "./PatientInsurancePayForCover"

// ── Mocks ──────────────────────────────────────────────────────────────────

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

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={["/patients/insurance/pay-for-cover"]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// This route renders the same SummaryBlock as add-beneficiaries and crashed
// identically on a direct visit (comprehensive audit, findings §0).
describe("PatientInsurancePayForCover crash guards", () => {
  it("renders on a direct visit with no router state", async () => {
    render(wrap(<PatientInsurancePayForCover />))

    expect(await screen.findByText("Pay for your cover")).toBeInTheDocument()
    expect(screen.getByText("No plan selected")).toBeInTheDocument()
  })
})
