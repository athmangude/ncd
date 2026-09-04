import { useQuery } from "@tanstack/react-query"
import { myNetworkQueryKey } from "../PatientMyNetwork"
import { supabase } from "@/lib/supabase"
import type {
  NetworkData,
  NetworkMember,
  SentInvite,
  ReceivedInvite,
} from "@/hooks/usePatientNetwork"

export interface ProcessedNetworkData {
  network: NetworkMember[]
  invites: SentInvite[]
  receivedInvites: ReceivedInvite[]
  slots?: NetworkData["slots"]
  adults: NetworkMember[]
  children: NetworkMember[]
  isAccountableFull: boolean
  isAuxiliaryFull: boolean
  isAllFull: boolean
  accountableSlotsAvailable: number
  accountableSlotsMax: number
}

const ACCOUNTABLE_MAX = 3
const AUXILIARY_MAX = 5

export function useNetworkData() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [myNetworkQueryKey],
    queryFn: async (): Promise<NetworkData> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const [membersRes, invitesRes] = await Promise.all([
        supabase
          .from("network_members")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("network_invites")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ])

      if (membersRes.error) throw membersRes.error
      if (invitesRes.error) throw invitesRes.error

      const network: NetworkMember[] = (membersRes.data ?? []).map((m) => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        phoneNumber: m.phone_number ?? null,
        profilePhoto: m.profile_photo ?? null,
        relationship: m.relationship,
        type: m.type,
        status: m.status ?? "ACTIVE",
        nickname: m.nickname ?? undefined,
        joinedAt: m.joined_at ?? null,
        hasDefaultedLoan: m.has_defaulted_loan ?? false,
      }))

      const invites: SentInvite[] = (invitesRes.data ?? []).map((i) => ({
        id: i.id,
        firstName: i.first_name,
        lastName: i.last_name,
        phoneNumber: i.phone_number ?? "",
        status: i.status ?? "PENDING",
        profilePhoto: i.profile_photo ?? null,
        inviteLink: i.invite_link ?? undefined,
        nickname: i.nickname ?? undefined,
        relationship: i.relationship ?? undefined,
        createdAt: i.created_at ?? undefined,
      }))

      const accountableUsed = network.filter(
        (n) => n.type === "ACCOUNTABLE",
      ).length
      const auxiliaryUsed = network.filter(
        (n) => n.type === "AUXILIARY",
      ).length
      const pendingAccountable = invites.filter(
        (i) => i.status === "PENDING",
      ).length

      return {
        network,
        invites,
        receivedInvites: [],
        slots: {
          accountable: {
            used: accountableUsed,
            max: ACCOUNTABLE_MAX,
            reserved: pendingAccountable,
          },
          auxiliary: {
            used: auxiliaryUsed,
            max: AUXILIARY_MAX,
            reserved: 0,
          },
        },
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  })

  const {
    network = [],
    invites = [],
    receivedInvites = [],
    slots,
  } = (data as NetworkData) || {}

  const adults = network.filter(
    (n: NetworkMember) => n.relationship !== "CHILD",
  )
  const children = network.filter(
    (n: NetworkMember) => n.relationship === "CHILD",
  )

  const isAccountableFull = slots?.accountable
    ? slots.accountable.used + slots.accountable.reserved >=
      slots.accountable.max
    : false
  const isAuxiliaryFull = slots?.auxiliary
    ? slots.auxiliary.used + slots.auxiliary.reserved >= slots.auxiliary.max
    : false
  const isAllFull = isAccountableFull && isAuxiliaryFull

  const accountableSlotsAvailable = slots?.accountable
    ? Math.max(
        0,
        slots.accountable.max -
          (slots.accountable.used + slots.accountable.reserved),
      )
    : 0
  const accountableSlotsMax = slots?.accountable?.max || 0

  const processedData: ProcessedNetworkData = {
    network,
    invites,
    receivedInvites,
    slots,
    adults,
    children,
    isAccountableFull,
    isAuxiliaryFull,
    isAllFull,
    accountableSlotsAvailable,
    accountableSlotsMax,
  }

  return {
    data: processedData,
    isLoading,
    isError,
    error,
    refetch,
  }
}
