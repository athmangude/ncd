import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { type ReactNode } from "react"
import axios from "axios"
import { PatientMembershipSuccess } from "./PatientMembershipSuccess"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

const { mockSyncCircle } = vi.hoisted(() => ({ mockSyncCircle: vi.fn() }))

vi.mock("../../hooks/useCircleSync", () => ({
  useCircleSync: () => mockSyncCircle,
}))

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
      <MemoryRouter initialEntries={["/patients/membership-success"]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// The credit-limit API returns currency as an OBJECT. Passing it straight to
// formatMoney threw `RangeError: Invalid currency code` and crashed the screen
// (comprehensive audit, findings section 0). The fix passes currency?.code.
describe("PatientMembershipSuccess crash guards", () => {
  it("formats the credit limit from a currency object", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        creditLimit: {
          totalCreditLimitAmount: 6000,
          currency: { code: "KES", name: "Kenyan Shilling" },
        },
      },
    })

    render(wrap(<PatientMembershipSuccess />))

    expect(await screen.findByText("Profile Completed!")).toBeInTheDocument()
    // testing-library's normalizer collapses Intl's non-breaking spaces
    // (U+00A0, char code 160) into regular spaces, so the expected string
    // must do the same
    const expected = (6000)
      .toLocaleString("en-US", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(new RegExp(String.fromCharCode(160), "g"), " ")
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it("renders a dash when the credit limit is missing entirely", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })

    render(wrap(<PatientMembershipSuccess />))

    expect(await screen.findByText("Profile Completed!")).toBeInTheDocument()
    expect(screen.getByText("-")).toBeInTheDocument()
  })
})
