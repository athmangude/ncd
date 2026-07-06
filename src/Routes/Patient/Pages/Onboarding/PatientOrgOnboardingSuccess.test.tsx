import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import axios from "axios"
import { PatientOrgOnboardingSuccess } from "./PatientOrgOnboardingSuccess"

vi.mock("axios")

// The "next step" hook pulls from the auth store / router; stub it out so the
// success screen can render in isolation.
vi.mock("../../hooks/useNextMembershipSetupStep", () => ({
  default: () => "/patients/choose-healthcare-plan",
}))

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
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe("PatientOrgOnboardingSuccess org-name fallback", () => {
  it("uses the org name when the API returns one", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { name: "Safaricom PLC", orgPlan: "ADVANCE" },
    })

    render(wrap(<PatientOrgOnboardingSuccess />))

    expect(
      await screen.findByText(/Safaricom PLC wants to make healthcare easier/)
    ).toBeInTheDocument()
  })

  it("falls back to 'Your organization' when the name is empty (no headless sentence)", async () => {
    // Empty/blank name previously rendered "…wants to make healthcare easier
    // for you." with no subject (audit §0 rendered-broken).
    vi.mocked(axios.get).mockResolvedValue({
      data: { name: "   ", orgPlan: "SACCO" },
    })

    render(wrap(<PatientOrgOnboardingSuccess />))

    expect(
      await screen.findByText(
        "Your organization wants to make healthcare easier for you."
      )
    ).toBeInTheDocument()
  })
})
