import { describe, it, expect } from "vitest"
import { getMemberDetailsVariant } from "./getMemberDetailsVariant"
import type { NetworkMember, SentInvite } from "@/hooks/usePatientNetwork"

function fakeMember(over: Partial<NetworkMember> = {}): NetworkMember {
  return {
    id: "m1",
    firstName: "K",
    lastName: "M",
    phoneNumber: null,
    profilePhoto: null,
    relationship: "FRIEND",
    status: "ACTIVE",
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    hasDefaultedLoan: false,
    ...over,
  }
}

function fakeInvite(over: Partial<SentInvite> = {}): SentInvite {
  return {
    id: "i1",
    firstName: "K",
    lastName: "M",
    phoneNumber: "+254712345678",
    status: "PENDING",
    profilePhoto: null,
    ...over,
  }
}

describe("getMemberDetailsVariant", () => {
  it("returns connected-new for a member who joined within 7 days", () => {
    const m = fakeMember({
      joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    })
    expect(getMemberDetailsVariant(m, "member")).toBe("connected-new")
  })

  it("returns connected-established for an older member", () => {
    expect(getMemberDetailsVariant(fakeMember(), "member")).toBe(
      "connected-established",
    )
  })

  it("returns connected-established for a member with no joinedAt", () => {
    expect(
      getMemberDetailsVariant(fakeMember({ joinedAt: null }), "member"),
    ).toBe("connected-established")
  })

  it("returns pending for a PENDING invite", () => {
    expect(getMemberDetailsVariant(fakeInvite({ status: "PENDING" }), "invite")).toBe(
      "pending",
    )
  })

  it("returns pending for OPENED and STALLED invites", () => {
    expect(getMemberDetailsVariant(fakeInvite({ status: "OPENED" }), "invite")).toBe(
      "pending",
    )
    expect(getMemberDetailsVariant(fakeInvite({ status: "STALLED" }), "invite")).toBe(
      "pending",
    )
  })

  it("returns rejected for REJECTED and CANCELLED invites", () => {
    expect(
      getMemberDetailsVariant(fakeInvite({ status: "REJECTED" }), "invite"),
    ).toBe("rejected")
    expect(
      getMemberDetailsVariant(fakeInvite({ status: "CANCELLED" }), "invite"),
    ).toBe("rejected")
  })
})
