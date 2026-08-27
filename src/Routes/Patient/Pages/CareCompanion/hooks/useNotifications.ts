import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { CareCompanionNotification } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const notificationsQueryKey = "careCompanionNotifications"

// ---------------------------------------------------------------------------
// useNotifications — fetch notification feed
// ---------------------------------------------------------------------------

export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: [notificationsQueryKey, { unreadOnly }],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/companion/notifications`,
        {
          params: unreadOnly ? { unreadOnly: true } : undefined,
        }
      )
      return response.data as CareCompanionNotification[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

// ---------------------------------------------------------------------------
// useMarkNotificationRead — mark a single notification as read
// ---------------------------------------------------------------------------

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/companion/notifications/${id}/read`
      )
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({
        queryKey: [notificationsQueryKey],
      })

      const previous = queryClient.getQueriesData<
        CareCompanionNotification[]
      >({ queryKey: [notificationsQueryKey] })

      queryClient.setQueriesData<CareCompanionNotification[]>(
        { queryKey: [notificationsQueryKey] },
        (old) =>
          old?.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          )
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [notificationsQueryKey] })
    },
  })
}
