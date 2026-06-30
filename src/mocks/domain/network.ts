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
  frozen?: boolean
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

/** Default slot capacities, used when the stored network has no `slots` block. */
const DEFAULT_SLOT_MAX = { accountable: 2, auxiliary: 3 } as const

/**
 * Read the network and recompute the slot counters from the live arrays so they
 * can never drift from the members/invites the rest of the app renders:
 *
 * - `used`     = active members in that category
 * - `reserved` = pending sent invites in that category
 *
 * Only `max` is preserved from storage (it's a capacity, not derived state).
 * Every mutation just edits the arrays; the next read re-derives the counts, so
 * adds, accepts, removals and facilitator seeding all stay consistent with the
 * actual circle regardless of which flow made the change.
 */
export function getNetwork(): NetworkData {
  const data = readObject<NetworkData>(NETWORK_KEY, networkSeed as NetworkData)
  return { ...data, slots: deriveSlots(data) }
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

/** Recompute `slots.{category}.{used,reserved}` from the live arrays. */
function deriveSlots(data: NetworkData): NetworkData["slots"] {
  const max = {
    accountable: data.slots?.accountable.max ?? DEFAULT_SLOT_MAX.accountable,
    auxiliary: data.slots?.auxiliary.max ?? DEFAULT_SLOT_MAX.auxiliary,
  }
  const used = { accountable: 0, auxiliary: 0 }
  const reserved = { accountable: 0, auxiliary: 0 }

  for (const member of data.network) {
    if (member.status !== "ACTIVE") continue
    used[slotCategory(member.relationship, member.type)] += 1
  }
  for (const invite of data.invites) {
    if (invite.status !== "PENDING") continue
    reserved[slotCategory(invite.relationship)] += 1
  }

  return {
    accountable: {
      used: used.accountable,
      reserved: reserved.accountable,
      max: max.accountable,
    },
    auxiliary: {
      used: used.auxiliary,
      reserved: reserved.auxiliary,
      max: max.auxiliary,
    },
  }
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
    isFrozen: getNetwork().frozen === true,
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
 * Append a sent invite. The reserved-slot count moves automatically because
 * `getNetwork` re-derives slots from the pending invites on the next read, so
 * an invite added in the upgrade flow or mid-payment shows up immediately.
 */
export function addSentInvite(invite: SentInvite): NetworkData {
  const data = getNetwork()
  const next: NetworkData = {
    ...data,
    invites: [...data.invites, invite],
  }
  setNetwork(next)
  return getNetwork()
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

  // Move the invitee from pending to active; slots re-derive on the next read
  // (the reserved invite becomes a used member automatically).
  const next: NetworkData = {
    ...data,
    network: [...data.network, member],
    invites: data.invites.filter((item) => item.id !== inviteId),
  }
  setNetwork(next)
  return getNetwork()
}

/**
 * Remove an active circle member by id. Their used slot frees automatically
 * (slots re-derive from the remaining members on the next read), so removing
 * someone reopens capacity in the add-member flow.
 */
export function removeMember(memberId: string): NetworkData {
  const data = getNetwork()
  const next: NetworkData = {
    ...data,
    network: data.network.filter((member) => member.id !== memberId),
  }
  setNetwork(next)
  return getNetwork()
}

/** Drop a pending sent invite by id (its reserved slot frees on re-derive). */
export function removeInvite(inviteId: string): NetworkData {
  const data = getNetwork()
  const next: NetworkData = {
    ...data,
    invites: data.invites.filter((item) => item.id !== inviteId),
  }
  setNetwork(next)
  return getNetwork()
}

/** Freeze or unfreeze the circle (surfaced through `getPatientCircleSummary`). */
export function setCircleFrozen(frozen: boolean): NetworkData {
  const next: NetworkData = { ...getNetwork(), frozen }
  setNetwork(next)
  return getNetwork()
}

/**
 * Accept an invite the participant received: move the inviter into the active
 * circle as an accountable member (so it counts toward a used slot, the same as
 * accepting a sent invite). No-op for an unknown id.
 */
export function acceptReceivedInvite(inviteId: string): NetworkData {
  const data = getNetwork()
  const invite = data.receivedInvites.find((item) => item.id === inviteId)
  if (!invite) return data

  const member: NetworkMember = {
    id: invite.id,
    firstName: invite.inviterFirstName,
    lastName: invite.inviterLastName,
    phoneNumber: invite.phoneNumber ?? null,
    profilePhoto: invite.profilePhoto ?? null,
    relationship: "FRIEND",
    type: "ACCOUNTABLE",
    status: "ACTIVE",
    joinedAt: new Date().toISOString(),
    hasDefaultedLoan: false,
  }

  const next: NetworkData = {
    ...data,
    network: [...data.network, member],
    receivedInvites: data.receivedInvites.filter(
      (item) => item.id !== inviteId
    ),
  }
  setNetwork(next)
  return getNetwork()
}

/** Decline a received invite by id (drops it from the received list). */
export function declineReceivedInvite(inviteId: string): NetworkData {
  const data = getNetwork()
  const next: NetworkData = {
    ...data,
    receivedInvites: data.receivedInvites.filter(
      (item) => item.id !== inviteId
    ),
  }
  setNetwork(next)
  return getNetwork()
}
