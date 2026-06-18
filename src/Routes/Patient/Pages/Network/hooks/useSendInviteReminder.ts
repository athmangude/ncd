import { useMutation, useQueryClient } from "@tanstack/react-query"
import { myNetworkQueryKey } from "../PatientMyNetwork"
import { circleActivityQueryKey } from "@/Routes/Patient/Pages/Dashboard/hooks/useCircleActivity"

export interface SendInviteReminderResult {
  sent: number
  throttled?: boolean
}

export function useSendInviteReminder() {
  const qc = useQueryClient()
  return useMutation<SendInviteReminderResult, Error, string>({
    mutationFn: async (inviteId: string) => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/invites/send-reminder`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inviteId }),
        },
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
      return resp.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [myNetworkQueryKey] })
      qc.invalidateQueries({ queryKey: [circleActivityQueryKey] })
    },
  })
}
