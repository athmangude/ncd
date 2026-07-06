import { describe, it, expect } from "vitest"
import { formatMoney } from "./currencyUtilities"

// Intl currency output can contain non-breaking spaces, so valid-code
// expectations are built with the same toLocaleString call rather than
// hardcoded strings.
function currencyString(amount: number, code: string, decimals = false) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })
}

describe("formatMoney", () => {
  it("formats an amount with a valid currency code", () => {
    expect(formatMoney(5000, "KES")).toBe(currencyString(5000, "KES"))
  })

  it("includes decimals when requested", () => {
    expect(formatMoney(5000.5, "KES", true)).toBe(
      currencyString(5000.5, "KES", true)
    )
  })

  it("returns a dash for a null or undefined amount", () => {
    expect(formatMoney(null as unknown as number, "KES")).toBe("-")
    expect(formatMoney(undefined as unknown as number, "KES")).toBe("-")
  })

  it("parses string amounts and treats NaN as zero", () => {
    expect(formatMoney("5000" as unknown as number, "KES")).toBe(
      currencyString(5000, "KES")
    )
    expect(formatMoney("abc" as unknown as number, "KES")).toBe(
      currencyString(0, "KES")
    )
  })

  it("falls back to a plain number when the currency is missing", () => {
    expect(formatMoney(5000, undefined)).toBe("5,000")
    expect(formatMoney(5000, "")).toBe("5,000")
  })

  it("falls back to a plain number for an invalid ISO code", () => {
    expect(formatMoney(5000, "NOT_A_CODE")).toBe("5,000")
  })

  it("falls back to a plain number when a currency object is passed", () => {
    const currencyObject = { code: "KES", name: "Kenyan Shilling" }
    expect(formatMoney(5000, currencyObject as unknown as string)).toBe("5,000")
  })
})
