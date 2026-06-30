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
import { getLoginDetails } from "./profile"

beforeEach(() => {
  localStorage.clear()
})

const remainingLimit = () =>
  Number(getLoginDetails().creditLimit.remainingAmount)

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

  it("draws Available to Borrow down by the borrowed principal", () => {
    // Demo fixture starts at 3200 remaining.
    expect(remainingLimit()).toBe(3200)

    recordPayment({
      ...base,
      splits: [{ type: "LOAN", amount: 2000, repaymentPeriodDays: 31 }],
    })

    expect(remainingLimit()).toBe(1200)
  })

  it("only the LOAN portion of a mixed split affects the limit", () => {
    setCareFundBalance(10000)

    recordPayment({
      ...base,
      totalBillAmount: 3000,
      splits: [
        { type: "MPESA", amount: 1000 },
        { type: "CASHBACK", amount: 500 },
        { type: "LOAN", amount: 1500, repaymentPeriodDays: 31 },
      ],
    })

    // Limit: 3200 - 1500 (loan only). Cashback: 10000 - 500 spent + 50 earned
    // (5% of the 1000 MPESA portion).
    expect(remainingLimit()).toBe(1700)
    expect(getCareFundBalance()).toBe(9550)
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
