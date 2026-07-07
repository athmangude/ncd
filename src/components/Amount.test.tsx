import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Amount } from "./Amount"
import { formatMoney } from "@/utilities/currencyUtilities"

describe("Amount", () => {
  it("formats a value using formatMoney's KES default", () => {
    render(<Amount value={3200} data-testid="amount" />)
    expect(screen.getByTestId("amount").textContent).toBe(
      formatMoney(3200, "KES")
    )
  })

  it("respects a custom currency", () => {
    render(<Amount value={100} currency="USD" data-testid="amount" />)
    expect(screen.getByTestId("amount").textContent).toBe(
      formatMoney(100, "USD")
    )
  })

  it("includes decimals when requested", () => {
    render(<Amount value={1850} includeDecimals data-testid="amount" />)
    expect(screen.getByTestId("amount").textContent).toBe(
      formatMoney(1850, "KES", true)
    )
  })

  it("applies font-mono and tabular-nums for column alignment", () => {
    render(<Amount value={500} data-testid="amount" />)
    const el = screen.getByTestId("amount")
    expect(el.className).toContain("font-mono")
    expect(el.className).toContain("tabular-nums")
  })

  it("applies the hero size's fluid-amount-text var", () => {
    render(<Amount value={500} size="hero" data-testid="amount" />)
    const el = screen.getByTestId("amount")
    expect(el.className).toContain("--fluid-amount-text")
  })

  it("merges a custom className", () => {
    render(<Amount value={500} className="text-white" data-testid="amount" />)
    const el = screen.getByTestId("amount")
    expect(el.className).toContain("text-white")
  })
})
