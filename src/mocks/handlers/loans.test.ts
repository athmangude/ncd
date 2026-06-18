// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import {
  recordPayment,
  saveTransactionResult,
  getTransactionResult,
  PAYMENT_HISTORY_KEY,
} from "./loans"
import { readObject } from "../db"
import {
  getCareFundBalance,
  getCareFundTransactions,
  setCareFundBalance,
} from "../domain/careFund"

beforeEach(() => {
  localStorage.clear()
})

const base = {
  totalBillAmount: 1000,
  facilityName: "Test Hospital",
  patientName: "Test Patient",
}

describe("recordPayment", () => {
  it("earns 5% cashback on the MPESA portion", () => {
    setCareFundBalance(10000)

    recordPayment({ ...base, splits: [{ type: "MPESA", amount: 1000 }] })

    expect(getCareFundBalance()).toBe(10050)
    expect(getCareFundTransactions().some((t) => t.type === "EARNED")).toBe(
      true
    )
  })

  it("spends cashback for a CASHBACK split", () => {
    setCareFundBalance(10000)

    recordPayment({ ...base, splits: [{ type: "CASHBACK", amount: 400 }] })

    expect(getCareFundBalance()).toBe(9600)
    expect(getCareFundTransactions().some((t) => t.type === "SPENT")).toBe(true)
  })

  it("creates a loan for a LOAN split", () => {
    const { payment } = recordPayment({
      ...base,
      splits: [{ type: "LOAN", amount: 2000, repaymentPeriodDays: 31 }],
    })

    const loanSplit = payment.paymentSplits.find((s) => s.loan)
    expect(loanSplit?.loan).toBeTruthy()
    expect((loanSplit?.loan as { id: string }).id).toBeTruthy()
  })

  it("appends the payment to history under the supplied id", () => {
    recordPayment({
      ...base,
      paymentId: "pay-custom",
      splits: [{ type: "MPESA", amount: 1000 }],
    })

    const history = readObject<{ payments: { id: string }[] }>(
      PAYMENT_HISTORY_KEY,
      { payments: [] }
    )
    expect(history.payments.some((p) => p.id === "pay-custom")).toBe(true)
  })
})

describe("transaction results", () => {
  it("round-trips a saved result and returns null for unknown refs", () => {
    saveTransactionResult("ref-1", {
      id: "ref-1",
      status: "COMPLETED",
      totalBillAmount: 500,
      transactionAmount: 500,
      updatedAt: "now",
      transactionDateTime: "now",
      description: "loan repayment",
      isLoanRepayment: true,
      loanId: "loan-1",
      providerName: "Test Hospital",
      paymentSplits: [],
      careFundPotentialAmount: null,
    })

    expect(getTransactionResult("ref-1")?.totalBillAmount).toBe(500)
    expect(getTransactionResult("missing")).toBeNull()
  })
})
