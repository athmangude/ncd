import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoansCard } from "./LoansCard"

vi.mock("@/hooks/usePersistentBalance", () => ({
  usePersistentBalance: () => ({ showBalance: true, toggleBalance: vi.fn() }),
}))

const loanStats = {
  currency: "KES",
  remainingCreditLimit: 3200,
  outstandingAmount: 1200,
  totalPaid: 800,
} as any

function bgUrl(container: HTMLElement) {
  const layer = container.querySelector("[aria-hidden]") as HTMLElement | null
  return layer?.getAttribute("style") ?? ""
}

describe("LoansCard borrowing states", () => {
  it("active (unlocked, not frozen): full-colour art, no frozen padlock", () => {
    const { container } = render(<LoansCard loanStats={loanStats} />)
    expect(
      screen.queryByAltText("Locked — tap to upgrade")
    ).not.toBeInTheDocument()
    expect(bgUrl(container)).toMatch(/loans-card-background/)
    expect(bgUrl(container)).not.toMatch(/locked-card-background/)
  })

  it("not-yet-unlocked (isLocked): neutral grey art, NO cracked/frozen overlay", () => {
    const { container } = render(<LoansCard loanStats={loanStats} isLocked />)
    expect(
      screen.queryByAltText("Locked — tap to upgrade")
    ).not.toBeInTheDocument()
    expect(bgUrl(container)).toMatch(/locked-card-background/)
  })

  it("frozen (default/revoked): shows the cracked-glass frozen overlay", () => {
    render(<LoansCard loanStats={loanStats} isFrozen />)
    expect(screen.getByAltText("Locked — tap to upgrade")).toBeInTheDocument()
  })

  it("frozen takes precedence over isLocked", () => {
    render(<LoansCard loanStats={loanStats} isLocked isFrozen />)
    expect(screen.getByAltText("Locked — tap to upgrade")).toBeInTheDocument()
  })
})
