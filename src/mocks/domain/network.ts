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

export function getNetwork(): NetworkData {
  return readObject<NetworkData>(NETWORK_KEY, networkSeed as NetworkData)
}

export function setNetwork(data: NetworkData): void {
  writeObject<NetworkData>(NETWORK_KEY, data)
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

  const member: NetworkMember = {
    id: invite.id,
    firstName: invite.firstName,
    lastName: invite.lastName,
    phoneNumber: invite.phoneNumber ?? null,
    profilePhoto: invite.profilePhoto ?? null,
    relationship: invite.relationship ?? "FRIEND",
    type: "AUXILIARY",
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

  if (next.slots) {
    next.slots = {
      ...next.slots,
      auxiliary: {
        ...next.slots.auxiliary,
        used: next.slots.auxiliary.used + 1,
      },
    }
  }

  setNetwork(next)
  return next
}
