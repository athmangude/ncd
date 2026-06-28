// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { consumeCode } from "./auth/recipe-passwordless"
import {
  hasMockAccount,
  markMockAccountCreated,
  mockSessionExists,
  startMockSession,
} from "./auth/session"
import { seedEmptyProfile, seedFreshAccount } from "./domain/seed"
import { clearAllParticipantState } from "./domain/reset"
import { getLoginDetails, patchLoginDetails } from "./handlers/profile"
import { readCollection } from "./db"
import { LOANS_KEY } from "./handlers/loans"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"

beforeEach(() => localStorage.clear())

describe("seedEmptyProfile", () => {
  it("writes a blank profile and empty collections without a session", () => {
    seedEmptyProfile()

    expect(getLoginDetails().firstName).toBe("")
    expect(readCollection(LOANS_KEY, [{ id: "x" }])).toEqual([])
    // No session/account flags are touched.
    expect(mockSessionExists()).toBe(false)
    expect(hasMockAccount()).toBe(false)
  })
})

describe("OTP sign-up (consumeCode)", () => {
  it("a brand-new participant gets a session + a blank onboarding profile (not the demo)", async () => {
    const res = await consumeCode({ userInputCode: "123456" })

    expect(res.createdNewRecipeUser).toBe(true)
    expect(mockSessionExists()).toBe(true)
    expect(hasMockAccount()).toBe(true)
    // Blank profile so the onboarding journey runs, rather than the rich fixture.
    expect(getLoginDetails().firstName).toBe("")
  })

  it("a returning participant keeps the profile they already built", async () => {
    // Simulate an already-onboarded returning user.
    markMockAccountCreated()
    startMockSession()
    patchLoginDetails({ firstName: "Returning" })

    const res = await consumeCode({ userInputCode: "123456" })

    expect(res.createdNewRecipeUser).toBe(false)
    expect(getLoginDetails().firstName).toBe("Returning")
  })
})

describe("sign out wipes back to a fresh, unseeded state", () => {
  it("clearAllParticipantState removes the account, session and mock data", () => {
    seedFreshAccount()
    patchLoginDetails({ firstName: "Mid-test" })
    expect(hasMockAccount()).toBe(true)

    clearAllParticipantState()

    expect(hasMockAccount()).toBe(false)
    expect(mockSessionExists()).toBe(false)
    expect(localStorage.getItem("mock:login-details")).toBeNull()
  })

  it("the auth store signOut clears participant state and resets the store", async () => {
    seedFreshAccount()
    patchLoginDetails({ firstName: "Mid-test" })
    usePatientAuthStore.getState().setUser({ firstName: "Mid-test" })

    await usePatientAuthStore.getState().signOut()

    expect(usePatientAuthStore.getState().user).toBeNull()
    expect(hasMockAccount()).toBe(false)
    expect(mockSessionExists()).toBe(false)
    expect(localStorage.getItem("mock:login-details")).toBeNull()
  })
})
