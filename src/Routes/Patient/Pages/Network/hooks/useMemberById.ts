import {
  usePatientNetwork,
  type NetworkMember,
  type SentInvite,
} from "@/hooks/usePatientNetwork"
import type { MemberSubjectKind } from "../lib/getMemberDetailsVariant"

type RefetchFn = ReturnType<typeof usePatientNetwork>["refetch"]

export interface UseMemberByIdResult {
  subject: NetworkMember | SentInvite | null
  kind: MemberSubjectKind | null
  isLoading: boolean
  notFound: boolean
  refetch: RefetchFn
}

export function useMemberById(
  targetId: string | undefined,
): UseMemberByIdResult {
  const network = usePatientNetwork()

  if (network.isLoading || !network.data || !targetId) {
    return {
      subject: null,
      kind: null,
      isLoading: network.isLoading,
      notFound: false,
      refetch: network.refetch,
    }
  }

  const member = network.data.network.find((m) => m.id === targetId) ?? null
  if (member) {
    return {
      subject: member,
      kind: "member",
      isLoading: false,
      notFound: false,
      refetch: network.refetch,
    }
  }

  const invite = network.data.invites.find((i) => i.id === targetId) ?? null
  if (invite) {
    return {
      subject: invite,
      kind: "invite",
      isLoading: false,
      notFound: false,
      refetch: network.refetch,
    }
  }

  return {
    subject: null,
    kind: null,
    isLoading: false,
    notFound: true,
    refetch: network.refetch,
  }
}
