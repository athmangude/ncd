// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import {
  addCareFundTransaction,
  adjustCareFundBalance,
  buildCareFundAccountSummary,
  earnCashback,
  getCareFundBalance,
  getCareFundTotals,
  getCareFundTransactions,
  setCareFundBalance,
} from "./careFund"
import { getLoginDetails } from "../handlers/profile"

beforeEach(() => {
  localStorage.clear()
})

describe("careFund domain", () => {
  it("seeds the balance from the profile fixture", () => {
    expect(getCareFundBalance()).toBe(1850)
  })

  it("clamps the balance at zero", () => {
    expect(setCareFundBalance(-100)).toBe(0)
    expect(getCareFundBalance()).toBe(0)
  })

  it("adjusts the balance and reflects it on the profile", () => {
    setCareFundBalance(1000)
    expect(adjustCareFundBalance(250)).toBe(1250)
    expect(Number(getLoginDetails().careFundAccount?.careFundBalance)).toBe(1250)
  })

  it("earns cashback: raises balance and prepends an EARNED txn", () => {
    setCareFundBalance(1000)
    const before = getCareFundTransactions().length

    earnCashback(200, "Test reward")

    expect(getCareFundBalance()).toBe(1200)
    const txns = getCareFundTransactions()
    expect(txns.length).toBe(before + 1)
    expect(txns[0].type).toBe("EARNED")
    expect(txns[0].transactionAmount).toBe(200)
    expect(txns[0].description).toBe("Test reward")
  })

  it("ignores non-positive cashback", () => {
    setCareFundBalance(1000)
    expect(earnCashback(0, "noop")).toBeNull()
    expect(getCareFundBalance()).toBe(1000)
  })

  it("totals only completed earned/spent entries", () => {
    const { totalEarned, totalSpent } = getCareFundTotals()
    // Fixture: EARNED 500 + SPENT 800 completed; transfers + pending excluded.
    expect(totalEarned).toBe(500)
    expect(totalSpent).toBe(800)
  })

  it("summary exposes careFundBalance and balance from the profile", () => {
    setCareFundBalance(1500)
    const summary = buildCareFundAccountSummary()
    expect(summary.careFundBalance).toBe("1500")
    expect(summary.balance).toBe(1500)
  })

  it("addCareFundTransaction fills sensible defaults", () => {
    const txn = addCareFundTransaction({ transactionAmount: 50, type: "SPENT" })
    expect(txn.id).toBeTruthy()
    expect(txn.status).toBe("COMPLETED")
    expect(getCareFundTransactions()[0].id).toBe(txn.id)
  })
})
