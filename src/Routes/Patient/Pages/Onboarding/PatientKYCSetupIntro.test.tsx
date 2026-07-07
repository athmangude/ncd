import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientKYCSetupIntro from "./PatientKYCSetupIntro"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { KYC: { INTRO_VIEW: "kyc_intro_view" } },
}))

// Return loaded (non-loading) network data so the screen renders past LoadingPage.
vi.mock("@/hooks/useOfflinePatientData", () => ({
  useOfflinePatientData: () => ({
    data: { network: [], invites: [], receivedInvites: [] },
    isLoading: false,
  }),
}))

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: Record<string, unknown> }) => unknown
  ) => sel({ user: {} }),
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
  return createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/kyc-setup-intro"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientKYCSetupIntro content-header migration", () => {
  it("renders the hero title as the single content-header h1", () => {
    render(wrap(<PatientKYCSetupIntro />))

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent(/Upgrade to Jireh Plus/i)
  })

  it("shows the 'Upgrade to Jireh Plus' title once (no duplicate app-bar title)", () => {
    render(wrap(<PatientKYCSetupIntro />))

    // The old app-bar BackTitleHeader title duplicated the hero heading; after
    // the migration the phrase lives only in the content header + its img alt.
    const headings = screen
      .getAllByRole("heading")
      .filter((h) => /Upgrade to Jireh Plus/i.test(h.textContent || ""))
    expect(headings).toHaveLength(1)
  })

  it("still renders the Continue CTA in the footer", () => {
    render(wrap(<PatientKYCSetupIntro />))

    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
  })
})
