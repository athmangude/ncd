import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

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

const ACCOUNTABLE_MAX = 3
const AUXILIARY_MAX = 5

export function usePatientNetwork() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const query = useQuery({
    queryKey: ["myConnectionsKey"],
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !isOffline,
  })

  return {
    data: query.data as NetworkData | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isOffline,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}
