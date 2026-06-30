// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import {
  activateMembership,
  adjustRemainingCreditLimit,
  deactivateMembership,
  isMembershipActive,
  DEFAULT_CREDIT_LIMIT,
} from "./membership"
import { getLoginDetails, patchLoginDetails } from "../handlers/profile"

const remaining = () => Number(getLoginDetails().creditLimit.remainingAmount)

beforeEach(() => {
  localStorage.clear()
})

describe("membership domain", () => {
  it("deactivate then activate toggles the flag and status", () => {
    deactivateMembership()
    expect(isMembershipActive()).toBe(false)
    expect(getLoginDetails().membershipStatus).toBe("INACTIVE")

    activateMembership()
    expect(isMembershipActive()).toBe(true)
    expect(getLoginDetails().membershipStatus).toBe("ACTIVE")
  })

  it("activate funds the credit limit when it was drained", () => {
    const current = getLoginDetails()
    patchLoginDetails({
      creditLimit: { ...current.creditLimit, remainingAmount: "0" },
    })

    activateMembership()

    const credit = getLoginDetails().creditLimit
    expect(Number(credit.remainingAmount)).toBe(
      Number(credit.totalCreditLimitAmount)
    )
  })

  it("seeds the default limit for a fresh upgrade with no limit yet", () => {
    const current = getLoginDetails()
    patchLoginDetails({
      creditLimit: {
        ...current.creditLimit,
        totalCreditLimitAmount: "0",
        remainingAmount: "0",
      },
    })

    activateMembership()

    const credit = getLoginDetails().creditLimit
    expect(Number(credit.totalCreditLimitAmount)).toBe(DEFAULT_CREDIT_LIMIT)
    expect(Number(credit.remainingAmount)).toBe(DEFAULT_CREDIT_LIMIT)
  })
})

describe("adjustRemainingCreditLimit", () => {
  // Demo fixture starts at 5000 total / 3200 remaining.
  it("borrowing draws the remaining limit down by the principal", () => {
    expect(adjustRemainingCreditLimit(-2000)).toBe(1200)
    expect(remaining()).toBe(1200)
  })

  it("repaying restores the remaining limit", () => {
    adjustRemainingCreditLimit(-2000) // 1200
    expect(adjustRemainingCreditLimit(500)).toBe(1700)
    expect(remaining()).toBe(1700)
  })

  it("never drops below zero", () => {
    expect(adjustRemainingCreditLimit(-99999)).toBe(0)
    expect(remaining()).toBe(0)
  })

  it("never exceeds the total credit limit when restoring", () => {
    expect(adjustRemainingCreditLimit(99999)).toBe(5000)
    expect(remaining()).toBe(5000)
  })
})
