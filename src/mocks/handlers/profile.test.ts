// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { getLoginDetails } from "./profile"
import { addSentInvite, acceptInvite } from "../domain/network"

beforeEach(() => {
  localStorage.clear()
})

describe("getLoginDetails — derived fields", () => {
  it("normalizes a legacy account type to a real role", () => {
    // Demo seed carries hasActiveMembership, so it reads as PLUS.
    expect(getLoginDetails().type).toBe("PLUS")
  })

  it("surfaces the circle from the network domain so the loan gate matches", () => {
    const profile = getLoginDetails()
    // Seed network has 2 adults -> circle qualifies for loans.
    expect(profile.patientCircle?.filledAccountableSlots).toBe(2)
    expect(Array.isArray(profile.network)).toBe(true)
    expect(profile.network?.length).toBeGreaterThan(0)
  })

  it("reflects a newly added + accepted adult member on the profile", () => {
    addSentInvite({
      id: "invite-new-adult",
      firstName: "New",
      lastName: "Adult",
      phoneNumber: "+254700000000",
      status: "PENDING",
      relationship: "FRIEND",
    })
    acceptInvite("invite-new-adult")

    expect(getLoginDetails().patientCircle?.filledAccountableSlots).toBe(3)
  })
})
