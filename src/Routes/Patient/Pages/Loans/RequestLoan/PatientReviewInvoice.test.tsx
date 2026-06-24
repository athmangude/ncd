import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientReviewInvoice from "./PatientReviewInvoice"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios", () => ({ default: { post: vi.fn() } }))

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
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
  localStorage.clear()
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
      { initialEntries: ["/patients/payment/request-payment/review-invoice"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientReviewInvoice footer migration", () => {
  it("renders the CTA in the footer, disabled while the form is incomplete", () => {
    // No stored invoice data → the form is invalid → CTA disabled.
    render(wrap(createElement(PatientReviewInvoice)))

    expect(
      screen.getByRole("button", { name: /Choose how to pay/i })
    ).toBeDisabled()
  })
})
