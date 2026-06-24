import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientSubscriptionsTransactionResult from "./PatientSubscriptionsTransactionResult"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { subscription: { plan: "plus" } },
    }),
  },
}))

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
      { initialEntries: ["/patients/subscriptions/transaction-result"] },
      ui
    )
  )
}

// PatientSubscriptionsTransactionResult self-shells via AppShell (Phase 5): the
// legacy padded container in PatientsHome was deleted, so this screen draws its
// own canonical frame with the CTA in the footer slot and the bespoke bubblegum
// tint preserved verbatim.
describe("PatientSubscriptionsTransactionResult", () => {
  it("renders the success content with the Continue CTA inside the shell", async () => {
    render(wrap(createElement(PatientSubscriptionsTransactionResult)))

    expect(await screen.findByText("Payment complete!")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Continue/i })).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
    // Bespoke bubblegum tint is preserved (relocate, not restyle).
    expect(document.querySelector(".bg-bubblegum-100")).toBeTruthy()
  })
})
