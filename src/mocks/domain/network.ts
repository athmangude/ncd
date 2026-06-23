/**
 * Circle network domain helpers.
 *
 * Owns the participant's circle state (active members + sent/received invites)
 * so both the network handlers and the facilitator panel read and write one
 * shared collection. `acceptInvite` is the cross-flow effect a facilitator
 * triggers to mark a sent invite as accepted — it moves the invitee out of the
 * pending list and into the active circle.
 */

import { readObject, writeObject } from "../db"
import networkSeed from "../fixtures/patient-network.json"

export const NETWORK_KEY = "patient-network"

export interface NetworkMember {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  profilePhoto: string | null
  relationship: string
  type?: string
  status: string
  nickname?: string
  joinedAt: string | null
  hasDefaultedLoan: boolean
}

export interface SentInvite {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  status: string
  profilePhoto?: string | null
  inviteLink?: string
  nickname?: string
  createdAt?: string
  relationship?: string
}

export interface ReceivedInvite {
  id: string
  inviterFirstName: string
  inviterLastName: string
  phoneNumber: string
  status: string
  profilePhoto?: string | null
}

export interface NetworkData {
  network: NetworkMember[]
  invites: SentInvite[]
  receivedInvites: ReceivedInvite[]
  slots?: {
    auxiliary: { used: number; max: number; reserved: number }
    accountable: { used: number; max: number; reserved: number }
  }
}

/** A selectable payee in the payment / gift flows. */
export interface Connection {
  id: string
  name: string
  value: string
  status: string
}

/** The circle summary the loan gate + KYC checklist read off the profile. */
export interface PatientCircleSummary {
  filledAccountableSlots: number
  status: string
  isFrozen: boolean
}

export function getNetwork(): NetworkData {
  return readObject<NetworkData>(NETWORK_KEY, networkSeed as NetworkData)
}

export function setNetwork(data: NetworkData): void {
  writeObject<NetworkData>(NETWORK_KEY, data)
}

/** Which slot bucket a relationship/type falls into (juniors are auxiliary). */
function slotCategory(
  relationship?: string,
  type?: string
): "auxiliary" | "accountable" {
  const value = (relationship || type || "").toUpperCase()
  return value === "CHILD" || value === "AUXILIARY"
    ? "auxiliary"
    : "accountable"
}

/**
 * Loan eligibility needs at least 2 accountable (adult, non-junior) circle
 * members. We derive that from the live network so the loan gate and KYC circle
 * step agree with what the circle UI shows — completing the upgrade flow's
 * "add 2 people" step makes loans usable, with no separate flag to keep in sync.
 */
export function getPatientCircleSummary(): PatientCircleSummary {
  const accountableMembers = getNetwork().network.filter(
    (member) =>
      member.status === "ACTIVE" &&
      slotCategory(member.relationship, member.type) === "accountable"
  )
  return {
    filledAccountableSlots: accountableMembers.length,
    status: "ACTIVE",
    isFrozen: false,
  }
}

/**
 * The single source of truth for "who can I pay for / gift to": active circle
 * members plus pending invites, shaped for the payment + gift pickers. Both the
 * `/patient-network/connections` handler and the care-fund transfer handler read
 * this, so anyone added anywhere (upgrade flow or mid-payment) shows up.
 */
export function getConnectionList(): Connection[] {
  const data = getNetwork()
  const fullName = (first: string, last: string) => `${first} ${last}`.trim()
  return [
    ...data.network.map((member) => ({
      id: member.id,
      name: fullName(member.firstName, member.lastName),
      value: member.id,
      status: member.status,
    })),
    ...data.invites.map((invite) => ({
      id: invite.id,
      name: fullName(invite.firstName, invite.lastName),
      value: invite.id,
      status: invite.status,
    })),
  ]
}

/**
 * Append a sent invite and reserve a circle slot for it so the slot counts move
 * the moment someone is added (in the upgrade flow or mid-payment). Accepting
 * the invite later converts the reserved slot into a used one.
 */
export function addSentInvite(invite: SentInvite): NetworkData {
  const data = getNetwork()
  const category = slotCategory(invite.relationship)
  const next: NetworkData = {
    ...data,
    invites: [...data.invites, invite],
    slots: data.slots
      ? {
          ...data.slots,
          [category]: {
            ...data.slots[category],
            reserved: data.slots[category].reserved + 1,
          },
        }
      : data.slots,
  }
  setNetwork(next)
  return next
}

/**
 * Mark a sent invite as accepted: move the invitee into the active circle and
 * drop them from the pending list. Returns the updated network unchanged if the
 * invite id is unknown.
 */
export function acceptInvite(inviteId: string): NetworkData {
  const data = getNetwork()
  const invite = data.invites.find((item) => item.id === inviteId)
  if (!invite) return data

  const category = slotCategory(invite.relationship)
  const member: NetworkMember = {
    id: invite.id,
    firstName: invite.firstName,
    lastName: invite.lastName,
    phoneNumber: invite.phoneNumber ?? null,
    profilePhoto: invite.profilePhoto ?? null,
    relationship: invite.relationship ?? "FRIEND",
    type: category === "auxiliary" ? "AUXILIARY" : "ACCOUNTABLE",
    status: "ACTIVE",
    nickname: invite.nickname,
    joinedAt: new Date().toISOString(),
    hasDefaultedLoan: false,
  }

  const next: NetworkData = {
    ...data,
    network: [...data.network, member],
    invites: data.invites.filter((item) => item.id !== inviteId),
  }

  // Convert the slot reserved at invite time into a used one.
  if (next.slots) {
    const slot = next.slots[category]
    next.slots = {
      ...next.slots,
      [category]: {
        ...slot,
        used: slot.used + 1,
        reserved: Math.max(0, slot.reserved - 1),
      },
    }
  }

  setNetwork(next)
  return next
}
