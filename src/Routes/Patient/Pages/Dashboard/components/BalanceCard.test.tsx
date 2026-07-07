import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { BalanceCard } from "./BalanceCard"

// usePersistentBalance touches localStorage; keep it deterministic.
vi.mock("@/hooks/usePersistentBalance", () => ({
  usePersistentBalance: () => ({ showBalance: true, toggleBalance: vi.fn() }),
}))

const loanStats = {
  currency: "KES",
  remainingCreditLimit: 3200,
  outstandingAmount: 1200,
} as any

function bgUrl(container: HTMLElement) {
  const layer = container.querySelector("[aria-hidden]") as HTMLElement | null
  return layer?.getAttribute("style") ?? ""
}

describe("BalanceCard borrowing states", () => {
  it("active (unlocked, not frozen): full-colour art, no frozen padlock", () => {
    const { container } = render(<BalanceCard loanStats={loanStats} />)
    expect(
      screen.queryByAltText("Locked — tap to upgrade")
    ).not.toBeInTheDocument()
    expect(bgUrl(container)).toMatch(/card-background/)
    expect(bgUrl(container)).not.toMatch(/locked-card-background/)
  })

  it("not-yet-unlocked (isLocked): neutral grey art, NO cracked/frozen overlay", () => {
    const { container } = render(<BalanceCard loanStats={loanStats} isLocked />)
    // No frozen padlock — this is an invitation to upgrade, not a broken card.
    expect(
      screen.queryByAltText("Locked — tap to upgrade")
    ).not.toBeInTheDocument()
    // Uses the neutral locked-card art.
    expect(bgUrl(container)).toMatch(/locked-card-background/)
  })

  it("frozen (default/revoked): shows the cracked-glass frozen overlay", () => {
    render(<BalanceCard loanStats={loanStats} isFrozen />)
    expect(screen.getByAltText("Locked — tap to upgrade")).toBeInTheDocument()
  })

  it("frozen takes precedence over isLocked", () => {
    render(<BalanceCard loanStats={loanStats} isLocked isFrozen />)
    expect(screen.getByAltText("Locked — tap to upgrade")).toBeInTheDocument()
  })
})
