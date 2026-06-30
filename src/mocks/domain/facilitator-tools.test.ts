// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { getWalletBalance, setWalletBalance } from "./wallets"
import { clearCollection } from "./reset"
import {
  acceptReceivedInvite,
  declineReceivedInvite,
  getNetwork,
  getPatientCircleSummary,
  removeInvite,
  removeMember,
  setCircleFrozen,
  setNetwork,
  type NetworkData,
} from "./network"
import { seedAtStage } from "./scenarios"
import { seedFreshAccount } from "./seed"
import { getLoginDetails } from "../handlers/profile"
import { readCollection, readObject, writeCollection, writeObject } from "../db"
import { hasMockAccount, mockSessionExists } from "../auth/session"

beforeEach(() => localStorage.clear())

describe("wallets", () => {
  it("sets one wallet balance without touching the others", () => {
    seedFreshAccount() // all four wallets start at 0
    setWalletBalance("MPESA", 500)

    expect(getWalletBalance("MPESA")).toBe(500)
    expect(getWalletBalance("LOAN")).toBe(0)
  })

  it("clamps a negative balance to 0", () => {
    seedFreshAccount()
    expect(setWalletBalance("CASHBACK", -50)).toBe(0)
  })
})

describe("clearCollection", () => {
  it("empties an object-shaped collection while keeping its shape", () => {
    writeObject("payment-history", {
      payments: [{ id: "p1" }],
      medicalRequests: [{ id: "m1" }],
    })
    clearCollection("payment-history")

    expect(readObject("payment-history", { payments: [{ id: "x" }] })).toEqual({
      payments: [],
      medicalRequests: [],
    })
  })

  it("empties an array-shaped collection", () => {
    writeCollection("loans", [{ id: "loan-1" }])
    clearCollection("loans")
    expect(readCollection("loans", [{ id: "seed" }])).toEqual([])
  })
})

const baseNetwork: NetworkData = {
  network: [
    {
      id: "m1",
      firstName: "Wanjiru",
      lastName: "Kamau",
      phoneNumber: "+254700000001",
      profilePhoto: null,
      relationship: "FRIEND",
      status: "ACTIVE",
      joinedAt: null,
      hasDefaultedLoan: false,
    },
  ],
  invites: [
    {
      id: "i1",
      firstName: "Brian",
      lastName: "Otieno",
      phoneNumber: "+254700000002",
      status: "PENDING",
      relationship: "FRIEND",
    },
  ],
  receivedInvites: [
    {
      id: "r1",
      inviterFirstName: "Grace",
      inviterLastName: "Mwangi",
      phoneNumber: "+254700000003",
      status: "PENDING",
    },
  ],
  frozen: false,
  slots: {
    auxiliary: { used: 0, max: 3, reserved: 0 },
    accountable: { used: 1, max: 2, reserved: 1 },
  },
}

describe("circle mutations", () => {
  beforeEach(() => setNetwork(baseNetwork))

  it("removes an active member", () => {
    removeMember("m1")
    expect(getNetwork().network).toHaveLength(0)
  })

  it("drops a pending sent invite and frees its reserved slot", () => {
    removeInvite("i1")
    const data = getNetwork()
    expect(data.invites).toHaveLength(0)
    expect(data.slots?.accountable.reserved).toBe(0)
  })

  it("freezes the circle through the summary", () => {
    setCircleFrozen(true)
    expect(getPatientCircleSummary().isFrozen).toBe(true)
  })

  it("accepts a received invite into the active circle", () => {
    acceptReceivedInvite("r1")
    const data = getNetwork()
    expect(data.receivedInvites).toHaveLength(0)
    expect(data.network.some((m) => m.firstName === "Grace")).toBe(true)
  })

  it("declines a received invite", () => {
    declineReceivedInvite("r1")
    expect(getNetwork().receivedInvites).toHaveLength(0)
  })
})

describe("seedAtStage", () => {
  it("phone-entry signs out to the unseeded phone-input state", () => {
    seedFreshAccount()
    const route = seedAtStage("phone-entry")
    expect(route).toBe("/patients")
    expect(mockSessionExists()).toBe(false)
    expect(hasMockAccount()).toBe(false)
  })

  it("needs-name lands at personal details with a blank name", () => {
    expect(seedAtStage("needs-name")).toBe("/patients/personal-details")
    expect(getLoginDetails().firstName).toBe("")
    expect(mockSessionExists()).toBe(true)
  })

  it("needs-pin has a name but no PIN", () => {
    expect(seedAtStage("needs-pin")).toBe("/patients/set-pin")
    expect(getLoginDetails().firstName).toBe("Test")
    expect(getLoginDetails().hasSetPin).toBeFalsy()
  })

  it("needs-id has a PIN but no verified ID", () => {
    expect(seedAtStage("needs-id")).toBe("/patients/id-verification-onboarding")
    expect(getLoginDetails().hasSetPin).toBe(true)
    expect(getLoginDetails().idVerificationStatus).toBeFalsy()
  })

  it("onboarded is fully verified but not a Plus member", () => {
    expect(seedAtStage("onboarded")).toBe("/patients")
    expect(getLoginDetails().idVerificationStatus).toBe("APPROVED")
    expect(getLoginDetails().hasActiveMembership).toBeFalsy()
  })

  it("onboarded-plus activates membership", () => {
    expect(seedAtStage("onboarded-plus")).toBe("/patients")
    expect(getLoginDetails().hasActiveMembership).toBe(true)
  })

  it("needs-circle is a Plus member sent to build their circle", () => {
    expect(seedAtStage("needs-circle")).toBe("/patients/kyc-add-circle-members")
    expect(getLoginDetails().hasActiveMembership).toBe(true)
  })
})
