import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: unknown }) => unknown) =>
    sel({ user: { accountReference: "REF-1", loans: [] } }),
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { LOAN_REPAYMENT: { ALL_LOANS_VIEW: "all_loans_view" } },
}))

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { outstandingAmount: 15000, currency: "KES" },
    }),
  },
}))

import PatientAllLoans from "./PatientAllLoans"

// formatMoney separates the code from the number with a non-breaking space, so
// normalize NBSP → space before comparing text.
const NBSP = String.fromCharCode(160)
const norm = (s: string | null) => (s ?? "").replace(new RegExp(NBSP, "g"), " ")

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(MemoryRouter, null, ui)
  )

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

describe("PatientAllLoans", () => {
  it("renders the outstanding total via <Amount> (Geist Mono / tabular-nums)", async () => {
    const { container } = render(wrap(<PatientAllLoans />))
    await waitFor(() => {
      const amount = container.querySelector(".font-mono")
      expect(amount).not.toBeNull()
      expect(norm(amount!.textContent)).toBe("KES 15,000")
      expect(amount!.className).toContain("tabular-nums")
    })
  })

  it("renders 'Total To Repay' / 'How to Repay' as headings, not <h1>", () => {
    render(wrap(<PatientAllLoans />))
    const totalLabel = screen.getByRole("heading", { name: "Total To Repay" })
    const howLabel = screen.getByRole("heading", { name: "How to Repay" })
    expect(totalLabel.tagName).toBe("H2")
    expect(howLabel.tagName).toBe("H2")
  })

  it("no longer carries the truncated 'font-me' class on 'How to Repay'", () => {
    render(wrap(<PatientAllLoans />))
    const howLabel = screen.getByRole("heading", { name: "How to Repay" })
    expect(howLabel.className).not.toContain("font-me")
  })
})
