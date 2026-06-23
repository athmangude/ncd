// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import {
  activateMembership,
  deactivateMembership,
  isMembershipActive,
  DEFAULT_CREDIT_LIMIT,
} from "./membership"
import { getLoginDetails, patchLoginDetails } from "../handlers/profile"

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
