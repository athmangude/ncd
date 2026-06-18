import { useMutation, useQueryClient } from "@tanstack/react-query"
import { circleActivityQueryKey } from "@/Routes/Patient/Pages/Dashboard/hooks/useCircleActivity"

export function useAcknowledgeRejection() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (inviteId: string) => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/invite/${inviteId}/acknowledge-rejection`,
        { method: "POST", credentials: "include" },
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [circleActivityQueryKey] })
    },
  })
}
