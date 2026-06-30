// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import {
  acceptInvite,
  acceptReceivedInvite,
  addSentInvite,
  getConnectionList,
  getNetwork,
  getPatientCircleSummary,
  removeInvite,
  removeMember,
  type SentInvite,
} from "./network"

beforeEach(() => {
  localStorage.clear()
})

function makeInvite(overrides: Partial<SentInvite> = {}): SentInvite {
  return {
    id: "invite-test",
    firstName: "New",
    lastName: "Payee",
    phoneNumber: "+254700000000",
    status: "PENDING",
    relationship: "FRIEND",
    ...overrides,
  }
}

describe("network domain", () => {
  it("acceptInvite moves a pending invite into the active circle", () => {
    const before = getNetwork()
    const invite = before.invites[0]
    expect(invite).toBeTruthy()

    const after = acceptInvite(invite.id)

    expect(after.invites.find((item) => item.id === invite.id)).toBeUndefined()
    const member = after.network.find((item) => item.id === invite.id)
    expect(member).toBeTruthy()
    expect(member?.status).toBe("ACTIVE")
  })

  it("is a no-op for an unknown invite id", () => {
    const before = getNetwork()
    const after = acceptInvite("does-not-exist")
    expect(after.network.length).toBe(before.network.length)
    expect(after.invites.length).toBe(before.invites.length)
  })
})

describe("network domain — connections + slots", () => {
  it("derives connections from active members and pending invites", () => {
    const list = getConnectionList()
    // Seed has 3 members + 1 pending invite.
    expect(list).toHaveLength(4)
    expect(list.some((c) => c.name === "Brian Kamau")).toBe(true)
    expect(list.some((c) => c.name === "Kevin Ochieng")).toBe(true)
  })

  it("adding a sent invite makes it selectable and reserves a slot", () => {
    const before = getNetwork().slots!.accountable.reserved

    addSentInvite(makeInvite())

    expect(getConnectionList().some((c) => c.name === "New Payee")).toBe(true)
    expect(getNetwork().slots!.accountable.reserved).toBe(before + 1)
  })

  it("a junior invite reserves an auxiliary slot", () => {
    const before = getNetwork().slots!.auxiliary.reserved

    addSentInvite(makeInvite({ id: "invite-child", relationship: "CHILD" }))

    expect(getNetwork().slots!.auxiliary.reserved).toBe(before + 1)
  })

  it("accepting an invite converts a reserved slot into a used one", () => {
    addSentInvite(makeInvite())
    const reservedBefore = getNetwork().slots!.accountable.reserved
    const usedBefore = getNetwork().slots!.accountable.used

    acceptInvite("invite-test")

    const slot = getNetwork().slots!.accountable
    expect(slot.used).toBe(usedBefore + 1)
    expect(slot.reserved).toBe(reservedBefore - 1)
    expect(getNetwork().network.some((m) => m.id === "invite-test")).toBe(true)
  })

  it("derives slot counts from the live arrays, ignoring stale stored counters", () => {
    // The seed's hand-authored counters disagree with its members; the derived
    // counts reflect the actual circle (2 active accountable, 1 active auxiliary,
    // 1 pending accountable invite — Kevin).
    const slots = getNetwork().slots!
    expect(slots.accountable.used).toBe(2)
    expect(slots.auxiliary.used).toBe(1)
    expect(slots.accountable.reserved).toBe(1)
  })

  it("removing an active member frees their used slot", () => {
    const before = getNetwork().slots!.accountable.used
    removeMember("member-001") // Brian, an accountable member
    expect(getNetwork().slots!.accountable.used).toBe(before - 1)
  })

  it("dropping a pending invite frees its reserved slot", () => {
    const before = getNetwork().slots!.accountable.reserved
    removeInvite("invite-001") // Kevin, a pending accountable invite
    expect(getNetwork().slots!.accountable.reserved).toBe(before - 1)
  })

  it("accepting a received invite counts toward an accountable used slot", () => {
    // Seed a received invite, then accept it.
    const data = getNetwork()
    data.receivedInvites = [
      {
        id: "received-1",
        inviterFirstName: "Grace",
        inviterLastName: "Njeri",
        phoneNumber: "+254700111222",
        status: "PENDING",
      },
    ]
    localStorage.setItem("mock:patient-network", JSON.stringify(data))

    const before = getNetwork().slots!.accountable.used
    acceptReceivedInvite("received-1")

    expect(getNetwork().slots!.accountable.used).toBe(before + 1)
    expect(getNetwork().network.some((m) => m.id === "received-1")).toBe(true)
  })
})

describe("network domain — patient circle summary (loan eligibility)", () => {
  it("counts active accountable (adult) members; the seed qualifies for loans", () => {
    // Seed network has 2 adults (Brian, Wanjiru) + 1 child (Esther).
    const summary = getPatientCircleSummary()
    expect(summary.filledAccountableSlots).toBe(2)
    expect(summary.status).toBe("ACTIVE")
    expect(summary.isFrozen).toBe(false)
  })

  it("a junior (CHILD) member does not count toward accountable slots", () => {
    addSentInvite(makeInvite({ id: "invite-child", relationship: "CHILD" }))
    acceptInvite("invite-child")
    // Still 2 adults — the accepted child is auxiliary, not accountable.
    expect(getPatientCircleSummary().filledAccountableSlots).toBe(2)
  })

  it("accepting an adult invite raises the accountable count", () => {
    addSentInvite(makeInvite({ id: "invite-adult", relationship: "SPOUSE" }))
    acceptInvite("invite-adult")
    expect(getPatientCircleSummary().filledAccountableSlots).toBe(3)
  })
})
