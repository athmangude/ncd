import { useMutation, useQueryClient } from "@tanstack/react-query"
import { circleActivityQueryKey } from "./useCircleActivity"

export function useAcknowledgeActivity() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (eventId: string) => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/circle-activity/${eventId}/acknowledge`,
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
