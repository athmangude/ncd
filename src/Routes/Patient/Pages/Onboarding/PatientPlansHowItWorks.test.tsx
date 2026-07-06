import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import PatientPlansHowItWorks from "./PatientPlansHowItWorks"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("../../hooks/useNextMembershipSetupStep", () => ({
  default: () => "/patients",
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

function wrap(ui: ReactNode, state?: Record<string, unknown>) {
  return (
    <MemoryRouter
      initialEntries={[{ pathname: "/patients/plans-how-it-works", state }]}
    >
      {ui}
    </MemoryRouter>
  )
}

// Direct visits/refreshes arrive without router state — reading state.plan
// unguarded crashed the screen (comprehensive audit, findings §0). The fix
// falls back to the FREE plan.
describe("PatientPlansHowItWorks crash guards", () => {
  it("renders the FREE plan on a direct visit with no router state", async () => {
    render(wrap(<PatientPlansHowItWorks />))

    expect(
      await screen.findByText("Build your dedicated health savings fund")
    ).toBeInTheDocument()
  })

  it("still renders the plan passed via router state", async () => {
    render(wrap(<PatientPlansHowItWorks />, { plan: "JIREH_PLUS" }))

    expect(await screen.findByText("499")).toBeInTheDocument()
  })
})
