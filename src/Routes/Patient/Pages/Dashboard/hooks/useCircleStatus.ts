import { useNetworkData } from "@/Routes/Patient/Pages/Network/hooks/useNetworkData"
import {
  useCircleActivity,
  type CircleActivityMember,
} from "./useCircleActivity"

export type BannerState =
  | { variant: "SET_UP_CIRCLE" }
  | {
      variant: "MEMBER_LEFT"
      member: CircleActivityMember
      stillQualifies: boolean
      eventId: string
    }
  | { variant: "PENDING_INVITES"; count: number }
  | { variant: "MEMBER_JOINED"; member: CircleActivityMember }
  | {
      variant: "INVITE_DECLINED"
      member: CircleActivityMember
      inviteId: string
    }

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function useCircleStatus() {
  const network = useNetworkData()
  const activity = useCircleActivity()

  const events = activity.events
  const recentLeft = events.find(
    (e) => e.eventType === "MEMBER_REMOVED" && !e.acknowledgedAt,
  )
  const recentJoined = events.find(
    (e) => e.eventType === "MEMBER_JOINED" && !e.acknowledgedAt,
  )

  const unacknowledgedRejections = events
    .filter(
      (e) =>
        e.eventType === "INVITE_REJECTED" &&
        e.acknowledgedAt === null &&
        typeof e.inviteId === "string",
    )
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
  const mostRecentRejection = unacknowledgedRejections[0]

  const pendingInvites = network.data.invites ?? []
  const eligiblePending = pendingInvites.filter((i) => {
    if (!i.createdAt) return false
    return Date.now() - new Date(i.createdAt).getTime() > TWO_HOURS_MS
  })

  const isLoading = network.isLoading || activity.isLoading
  const members = network.data.network
  const hasNoMembers = !isLoading && members.length === 0

  let activeBanner: BannerState | null = null
  if (hasNoMembers) {
    activeBanner = { variant: "SET_UP_CIRCLE" }
  } else if (mostRecentRejection && mostRecentRejection.inviteId) {
    activeBanner = {
      variant: "INVITE_DECLINED",
      member: mostRecentRejection.member,
      inviteId: mostRecentRejection.inviteId,
    }
  } else if (recentLeft) {
    activeBanner = {
      variant: "MEMBER_LEFT",
      member: recentLeft.member,
      stillQualifies: recentLeft.stillQualifiesForBorrowing,
      eventId: recentLeft.id,
    }
  } else if (eligiblePending.length > 0) {
    activeBanner = {
      variant: "PENDING_INVITES",
      count: eligiblePending.length,
    }
  } else if (recentJoined) {
    activeBanner = { variant: "MEMBER_JOINED", member: recentJoined.member }
  }

  return {
    members,
    pendingInvites,
    slots: network.data.slots,
    activeBanner,
    recentJoinedMemberId: recentJoined?.member.id ?? null,
    recentLeftMemberId: recentLeft?.member.id ?? null,
    isLoading,
    error: network.error || activity.error,
    refetchAll: () => Promise.all([network.refetch(), activity.refetch()]),
  }
}
