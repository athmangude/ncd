import { describe, it, expect } from "vitest"
import { resolveStatusVariant } from "./statusUtilities"

describe("resolveStatusVariant", () => {
  it.each([
    ["APPROVED", "success"],
    ["PAID", "success"],
    ["COMPLETED", "success"],
    ["PENDING", "warning"],
    ["SUBMITTED_FOR_APPROVAL", "warning"],
    ["DISBURSED", "warning"],
    ["PROCESSING", "info"],
    ["REPAYMENT", "info"],
    ["PAID_TRANSACTION_FEE", "info"],
    ["FAILED", "destructive"],
    ["REJECTED", "destructive"],
    ["DEFAULTED", "destructive"],
    ["OVERDUE", "destructive"],
  ] as const)("maps %s to %s", (status, variant) => {
    expect(resolveStatusVariant(status)).toBe(variant)
  })

  it("is case-insensitive", () => {
    expect(resolveStatusVariant("paid")).toBe("success")
    expect(resolveStatusVariant("Rejected")).toBe("destructive")
  })

  it("normalizes spaces and hyphens to underscores", () => {
    expect(resolveStatusVariant("submitted for approval")).toBe("warning")
    expect(resolveStatusVariant("paid-transaction-fee")).toBe("info")
    expect(resolveStatusVariant("  overdue  ")).toBe("destructive")
  })

  it("falls back to neutral for unknown statuses", () => {
    expect(resolveStatusVariant("SOMETHING_ELSE")).toBe("neutral")
  })

  it.each([null, undefined, ""])("falls back to neutral for %s", (status) => {
    expect(resolveStatusVariant(status)).toBe("neutral")
  })
})
