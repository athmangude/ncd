import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { invalidateCircleQueries } from "@/Routes/Patient/hooks/useCircleSync"
import { circleActivityQueryKey } from "@/Routes/Patient/Pages/Dashboard/hooks/useCircleActivity"

export function useCancelInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("network_invites")
        .delete()
        .eq("id", inviteId)
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      invalidateCircleQueries(qc)
      qc.invalidateQueries({ queryKey: [circleActivityQueryKey] })
    },
  })
}
