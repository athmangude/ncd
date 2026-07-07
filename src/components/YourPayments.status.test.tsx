import { describe, it, expect } from "vitest"
import { resolvePaymentStatusColor } from "./YourPayments"
import { resolveStatusColor } from "@/Routes/Patient/components/YourTreatments"

// Task 5: the status-enum switches must return semantic status TOKENS
// (success/warning/info/destructive/muted), never raw palette scale classes.
const RAW_PALETTE = /-(emerald|green|orange|red|blue|purple|neutral|amber)-\d/

describe("resolvePaymentStatusColor — status tokens, not raw palette", () => {
  it("maps completed/pending/failed/processing to solid status tokens", () => {
    expect(resolvePaymentStatusColor("COMPLETED")).toBe("bg-success-solid")
    expect(resolvePaymentStatusColor("PENDING")).toBe("bg-warning-solid")
    expect(resolvePaymentStatusColor("FAILED")).toBe("bg-destructive")
    expect(resolvePaymentStatusColor("PROCESSING")).toBe("bg-info-solid")
    expect(resolvePaymentStatusColor("SOMETHING_ELSE")).toBe(
      "bg-muted-foreground"
    )
  })

  it("returns no raw palette scale class for any status", () => {
    for (const s of ["COMPLETED", "PENDING", "FAILED", "PROCESSING", "x"]) {
      expect(resolvePaymentStatusColor(s)).not.toMatch(RAW_PALETTE)
    }
  })
})

describe("resolveStatusColor — status tokens, not raw palette", () => {
  it("maps loan/treatment statuses to status tokens", () => {
    expect(resolveStatusColor("APPROVED")).toBe("bg-success-solid")
    expect(resolveStatusColor("PAID")).toBe("bg-success-solid")
    expect(resolveStatusColor("SUBMITTED_FOR_APPROVAL")).toBe(
      "bg-warning-solid"
    )
    expect(resolveStatusColor("REPAYMENT")).toBe("bg-info-solid")
    expect(resolveStatusColor("REJECTED")).toBe("bg-destructive")
    expect(resolveStatusColor("DEFAULTED")).toBe("bg-destructive")
    expect(resolveStatusColor("OVERDUE")).toBe("bg-destructive")
    expect(resolveStatusColor("PAID_TRANSACTION_FEE")).toBe("bg-primary")
    expect(resolveStatusColor("PENDING")).toBe("bg-muted-foreground")
  })

  it("returns no raw palette scale class for any status", () => {
    for (const s of [
      "APPROVED",
      "PAID",
      "SUBMITTED_FOR_APPROVAL",
      "REPAYMENT",
      "REJECTED",
      "DEFAULTED",
      "OVERDUE",
      "PAID_TRANSACTION_FEE",
      "PENDING",
      "unknown",
    ]) {
      expect(resolveStatusColor(s)).not.toMatch(RAW_PALETTE)
    }
  })
})
