import { useQuery } from "@tanstack/react-query"

export type CircleActivityEventType =
  | "MEMBER_JOINED"
  | "MEMBER_REMOVED"
  | "INVITE_REJECTED"

export interface CircleActivityMember {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export interface CircleActivityEvent {
  id: string
  eventType: CircleActivityEventType
  occurredAt: string
  acknowledgedAt: string | null
  member: CircleActivityMember
  stillQualifiesForBorrowing: boolean
  inviteId?: string
}

export const circleActivityQueryKey = "circle-activity"

export function useCircleActivity() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [circleActivityQueryKey],
    queryFn: async (): Promise<{ events: CircleActivityEvent[] }> => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/circle-activity`,
        { credentials: "include" },
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
      return resp.json()
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  return {
    events: data?.events ?? [],
    isLoading,
    isError,
    error,
    refetch,
  }
}
