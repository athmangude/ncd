import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSupabase, supabase } from "@/lib/supabase"
import axios from "axios"
import type { CareCompanionNotification } from "@/types/care-companion"

export const notificationsQueryKey = "careCompanionNotifications"

export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: [notificationsQueryKey, { unreadOnly }],
    queryFn: async () => {
      if (useSupabase) {
        let query = supabase
          .from("notifications")
          .select("*")
          .order("sent_at", { ascending: false })
        if (unreadOnly) {
          query = query.is("read_at", null)
        }
        const { data, error } = await query
        if (error) throw error
        return (data ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          type: row.type as string,
          title: row.title as string,
          body: (row.body ?? "") as string,
          deepLink: (row.deep_link ?? "/patients/companion") as string,
          scheduledAt: (row.sent_at ?? "") as string,
          sentAt: (row.sent_at ?? null) as string | null,
          readAt: (row.read_at ?? null) as string | null,
          metadata: (row.metadata ?? null) as Record<string, string> | null,
        })) as CareCompanionNotification[]
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/companion/notifications`,
        {
          params: unreadOnly ? { unreadOnly: true } : undefined,
        },
      )
      return response.data as CareCompanionNotification[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (useSupabase) {
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", id)
        if (error) throw error
        return
      }

      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/companion/notifications/${id}/read`,
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
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
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
