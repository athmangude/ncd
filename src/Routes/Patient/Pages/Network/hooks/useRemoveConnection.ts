import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { invalidateCircleQueries } from "@/Routes/Patient/hooks/useCircleSync"
import { circleActivityQueryKey } from "@/Routes/Patient/Pages/Dashboard/hooks/useCircleActivity"

export type RemoveConnectionType = "NETWORK" | "CHILD"

export interface RemoveConnectionInput {
  connectionId: string
  type: RemoveConnectionType
}

export function useRemoveConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ connectionId }: RemoveConnectionInput) => {
      const { error } = await supabase
        .from("network_members")
        .delete()
        .eq("id", connectionId)
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      invalidateCircleQueries(qc)
      qc.invalidateQueries({ queryKey: [circleActivityQueryKey] })
    },
  })
}
