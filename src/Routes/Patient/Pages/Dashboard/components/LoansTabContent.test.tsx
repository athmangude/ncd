import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import { LoansTabContent } from "./LoansTabContent"

// ── Mocks ──────────────────────────────────────────────────────────────────
// Stub the heavy children — this test only cares about role-gated CTAs.
vi.mock("./LoansCard", () => ({ LoansCard: () => null }))
vi.mock("../../../components/YourTreatments", () => ({ default: () => null }))

function wrap(ui: ReactNode) {
  return createElement(MemoryRouter, null, ui)
}

const baseProps = {
  loans: [],
  loanStats: {},
  hasActiveMembership: true,
  onUpgrade: vi.fn(),
  isLoading: false,
  animationMode: "switch" as const,
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("LoansTabContent — loan-eligibility gating", () => {
  it("shows 'How to raise my limit' for loan-eligible roles (PLUS)", () => {
    render(wrap(<LoansTabContent {...baseProps} type="PLUS" />))
    expect(
      screen.getByRole("button", { name: /How to raise my limit/i })
    ).toBeInTheDocument()
  })

  it("hides 'How to raise my limit' for non-loan roles (ORG)", () => {
    render(wrap(<LoansTabContent {...baseProps} type="ORG" />))
    expect(
      screen.queryByRole("button", { name: /How to raise my limit/i })
    ).not.toBeInTheDocument()
  })
})
