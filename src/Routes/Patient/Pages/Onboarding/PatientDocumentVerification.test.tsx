import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientDocumentVerification from "./PatientDocumentVerification"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    KYC: {
      DOCUMENT_VERIFICATION_VIEW: "document_verification_view",
      DOCUMENT_VERIFICATION_SUBMIT: "document_verification_submit",
    },
  },
}))

// SmileID is a heavy capture widget; stub it so the screen renders in jsdom.
vi.mock("@/components/SmileIDWrapper", () => ({
  SmileIDWrapper: () => createElement("div", { "data-testid": "smile-id" }),
}))

vi.mock("../../hooks/useNextKYCStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextKYCStep")>()
  return { ...actual, default: () => "/patients/kyc-add-circle-members" }
})

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
      { initialEntries: ["/patients/document-verification"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientDocumentVerification content-header migration", () => {
  it("renders the page title as the single content-header h1", () => {
    render(wrap(<PatientDocumentVerification />))

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Verify Identity",
    })
    expect(heading).toBeInTheDocument()
  })

  it("shows the title exactly once (no duplicate app-bar + content title)", () => {
    render(wrap(<PatientDocumentVerification />))

    expect(screen.getAllByText("Verify Identity")).toHaveLength(1)
  })

  it("renders the capture instructions as the header description", () => {
    render(wrap(<PatientDocumentVerification />))

    expect(
      screen.getByText(/capture your selfie and front photo of your ID/i)
    ).toBeInTheDocument()
  })
})
