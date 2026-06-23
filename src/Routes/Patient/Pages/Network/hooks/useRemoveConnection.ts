import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
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
    mutationFn: async ({ connectionId, type }: RemoveConnectionInput) => {
      const resp = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/remove-connection`,
        { connectionId, type }
      )
      return resp.data
    },
    onSuccess: () => {
      // Removing a member can drop the circle below the loan threshold, so
      // refresh the gate + pickers alongside the circle list.
      invalidateCircleQueries(qc)
      qc.invalidateQueries({ queryKey: [circleActivityQueryKey] })
    },
  })
}
