import { useMutation, useQueryClient } from "@tanstack/react-query"
import { circleActivityQueryKey } from "./useCircleActivity"
import { myNetworkQueryKey } from "@/Routes/Patient/Pages/Network/PatientMyNetwork"

export interface SendRemindersResult {
  sent: number
  throttled: boolean
}

export function useSendInviteReminders() {
  const qc = useQueryClient()
  return useMutation<SendRemindersResult, Error, void>({
    mutationFn: async () => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/invites/send-reminders`,
        { method: "POST", credentials: "include" },
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
      return resp.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [circleActivityQueryKey] })
      qc.invalidateQueries({ queryKey: [myNetworkQueryKey] })
    },
  })
}
