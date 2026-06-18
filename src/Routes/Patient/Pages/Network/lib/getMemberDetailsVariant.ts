import type { NetworkMember, SentInvite } from "@/hooks/usePatientNetwork"

export type MemberDetailsVariant =
  | "connected-new"
  | "connected-established"
  | "pending"
  | "rejected"

export type MemberSubjectKind = "member" | "invite"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function isWithin7Days(timestamp?: string | null): boolean {
  if (!timestamp) return false
  const t = new Date(timestamp).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t < SEVEN_DAYS_MS
}

export function getMemberDetailsVariant(
  subject: NetworkMember | SentInvite,
  kind: MemberSubjectKind,
): MemberDetailsVariant {
  if (kind === "invite") {
    const status = (subject.status || "").toUpperCase()
    if (
      status === "REJECTED" ||
      status === "CANCELLED" ||
      status === "REVOKED"
    ) {
      return "rejected"
    }
    return "pending"
  }
  const member = subject as NetworkMember
  return isWithin7Days(member.joinedAt)
    ? "connected-new"
    : "connected-established"
}
