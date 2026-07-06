import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import PatientInsuranceAddBeneficiaries from "./PatientInsuranceAddBeneficiaries"

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

function wrap(ui: ReactNode, state?: Record<string, unknown>) {
  return (
    <MemoryRouter
      initialEntries={[
        { pathname: "/patients/insurance/add-beneficiaries", state },
      ]}
    >
      {ui}
    </MemoryRouter>
  )
}

// SummaryBlock read location.state.insurancePlan unguarded, so a direct
// visit/refresh crashed both insurance routes (comprehensive audit, findings
// §0). The fix renders placeholders instead.
describe("PatientInsuranceAddBeneficiaries crash guards", () => {
  it("renders with placeholders on a direct visit with no router state", async () => {
    render(wrap(<PatientInsuranceAddBeneficiaries />))

    expect(
      await screen.findByText(
        "Click to add your friends and family to your cover:"
      )
    ).toBeInTheDocument()
    expect(screen.getByText("No plan selected")).toBeInTheDocument()
  })

  it("still renders the plan summary when state is present", async () => {
    render(
      wrap(<PatientInsuranceAddBeneficiaries />, {
        insurancePlan: { plan: "STARTER", billingSchedule: "MONTHLY" },
      })
    )

    expect(await screen.findByText("monthly starter plan")).toBeInTheDocument()
  })
})
