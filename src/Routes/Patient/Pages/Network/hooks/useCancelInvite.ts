import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { invalidateCircleQueries } from "@/Routes/Patient/hooks/useCircleSync"
import { circleActivityQueryKey } from "@/Routes/Patient/Pages/Dashboard/hooks/useCircleActivity"

export function useCancelInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const resp = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/remove-invite`,
        { inviteId }
      )
      return resp.data
    },
    onSuccess: () => {
      // Cancelling a pending invite frees a reserved slot; refresh the gate +
      // pickers alongside the circle list.
      invalidateCircleQueries(qc)
      qc.invalidateQueries({ queryKey: [circleActivityQueryKey] })
    },
  })
}
