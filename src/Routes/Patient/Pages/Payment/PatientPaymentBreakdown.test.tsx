import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { createElement, type ReactNode } from "react"

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        totalBillAmount: 5000,
        currency: { code: "KES" },
        discountAmount: 0,
        paymentSplits: [
          {
            id: "s1",
            paymentSplitAmount: 3000,
            wallet: { type: "CARE_FUND", name: "Care Fund" },
          },
        ],
      },
    }),
  },
}))

import PatientPaymentBreakdown from "./PatientPaymentBreakdown"

// formatMoney separates the code from the number with a non-breaking space, so
// normalize NBSP → space before comparing text.
const NBSP = String.fromCharCode(160)
const norm = (s: string | null) => (s ?? "").replace(new RegExp(NBSP, "g"), " ")

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/payment/breakdown/p1"] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/patients/payment/breakdown/:id",
          element: ui,
        })
      )
    )
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

describe("PatientPaymentBreakdown", () => {
  it("renders every amount via <Amount> (font-mono / tabular-nums for column alignment)", async () => {
    const { container } = render(wrap(<PatientPaymentBreakdown />))
    await waitFor(() => {
      const monos = Array.from(container.querySelectorAll(".font-mono"))
      // Invoiced bill + Paid with Jireh (5,000 each) + Care Fund source (3,000).
      expect(monos.length).toBeGreaterThanOrEqual(3)
      monos.forEach((el) => expect(el.className).toContain("tabular-nums"))
    })
  })

  it("renders the payment-source amount via <Amount>", async () => {
    const { container } = render(wrap(<PatientPaymentBreakdown />))
    await waitFor(() => {
      const texts = Array.from(container.querySelectorAll(".font-mono")).map(
        (el) => norm(el.textContent)
      )
      expect(texts).toContain("KES 3,000")
    })
  })
})
