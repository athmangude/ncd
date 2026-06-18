import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientKYCAddCircleMembers from "./PatientKYCAddCircleMembers"

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/patients/kyc-add-circle-members", state: {} }),
  }
})

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: { firstName: string; lastName: string } }) => unknown) =>
    sel({ user: { firstName: "Test", lastName: "User" } }),
}))

vi.mock("@/Routes/Patient/hooks/useNextKYCStep", () => ({
  default: () => "/patients/pay-membership",
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

// ── Helpers ────────────────────────────────────────────────────────────────

function stubNetwork(network: unknown[], invites: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ network, invites, receivedInvites: [] }),
    })
  )
}

function wrap(ui: ReactNode) {
  return createElement(
    QueryClientProvider,
    {
      client: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    },
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/kyc-add-circle-members"] },
      ui
    )
  )
}

const adultAccepted = {
  id: "m1",
  firstName: "Mary",
  lastName: "Wanjiku",
  phoneNumber: "254712345678",
  relationship: "FRIEND",
  status: "ACTIVE",
  profilePhoto: null,
}

const adultPending = {
  id: "i1",
  firstName: "John",
  lastName: "Kamau",
  phoneNumber: "254787654321",
  relationship: "SIBLING",
  status: "PENDING",
  profilePhoto: null,
}

const adultPending2 = {
  id: "i2",
  firstName: "Alice",
  lastName: "Odhiambo",
  phoneNumber: "254711111111",
  relationship: "FRIEND",
  status: "PENDING",
  profilePhoto: null,
}

afterEach(() => {
  vi.unstubAllGlobals()
  mockNavigate.mockClear()
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientKYCAddCircleMembers", () => {
  it("empty state: shows 'Add 2 people' title and 2 empty slots", async () => {
    stubNetwork([], [])
    render(wrap(<PatientKYCAddCircleMembers />))

    expect(
      await screen.findByText(/Add 2 people to your Jireh Circle/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/2 of 2 adults slots available/i)).toBeInTheDocument()
    expect(screen.queryByText(/Confirmed:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Invites sent to:/i)).not.toBeInTheDocument()
  })

  it("partial state: shows 'Keep building' title and confirmed section", async () => {
    stubNetwork([adultAccepted], [])
    render(wrap(<PatientKYCAddCircleMembers />))

    expect(
      await screen.findByText(/Keep building your Circle/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/1 more adult needed/i)).toBeInTheDocument()
    expect(screen.getByText("Mary Wanjiku")).toBeInTheDocument()
    expect(screen.getByText(/Confirmed:/i)).toBeInTheDocument()
    expect(screen.queryByText(/Invites sent to:/i)).not.toBeInTheDocument()
  })

  it("partial + pending state: shows confirmed and pending sections", async () => {
    stubNetwork([adultAccepted], [adultPending])
    render(wrap(<PatientKYCAddCircleMembers />))

    expect(
      await screen.findByText(/Keep building your Circle/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Mary Wanjiku")).toBeInTheDocument()
    expect(screen.getByText("John Kamau")).toBeInTheDocument()
    expect(screen.getByText(/Confirmed:/i)).toBeInTheDocument()
    expect(screen.getByText(/Invites sent to:/i)).toBeInTheDocument()
    expect(screen.getByText(/Waiting\.\.\./i)).toBeInTheDocument()
  })

  it("waiting state: shows 'Waiting for your Circle to confirm' and orange warning", async () => {
    stubNetwork([], [adultPending, adultPending2])
    render(wrap(<PatientKYCAddCircleMembers />))

    expect(
      await screen.findByText(/Waiting for your Circle to confirm/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Your Circle is not yet active/i)).toBeInTheDocument()
    expect(screen.getByText(/2 of 2 adults slots pending/i)).toBeInTheDocument()
    expect(screen.getByText("John Kamau")).toBeInTheDocument()
    expect(screen.getByText("Alice Odhiambo")).toBeInTheDocument()
  })

  it("complete state: redirects to next step when 2 adults accepted", async () => {
    const adultAccepted2 = { ...adultAccepted, id: "m2", firstName: "Grace", lastName: "Mutua" }
    stubNetwork([adultAccepted, adultAccepted2], [])
    render(wrap(<PatientKYCAddCircleMembers />))

    await screen.findByText(/Upgrade to Jireh Plus/i)
    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/pay-membership",
      expect.objectContaining({ replace: true })
    )
  })

  it("CTA navigates to add-circle-member with returnPath", async () => {
    stubNetwork([], [])
    render(wrap(<PatientKYCAddCircleMembers />))

    const btn = await screen.findByRole("button", { name: /Add person/i })
    await userEvent.click(btn)

    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/network/add-circle-member",
      expect.objectContaining({
        state: expect.objectContaining({
          source: "onboarding",
          returnPath: "/patients/kyc-add-circle-members",
        }),
      })
    )
  })
})
