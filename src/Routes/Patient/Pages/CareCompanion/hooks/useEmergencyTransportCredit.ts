import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSupabase } from "@/lib/supabase"
import type { EmergencyTransportCredit } from "@/types/care-companion"

export type EmergencyTransportCreditData = EmergencyTransportCredit

export const emergencyTransportCreditQueryKey =
  "careCompanionEmergencyTransportCredit"

export function useEmergencyTransportCredit() {
  return useQuery({
    queryKey: [emergencyTransportCreditQueryKey],
    queryFn: async () => {
      if (useSupabase) {
        return {
          available: true,
          remainingAmount: "500",
          currency: "KES",
          maxAmount: "1000",
          usedAmount: "500",
        } as EmergencyTransportCreditData
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/emergency-transport-credit`
      )
      return response.data as EmergencyTransportCreditData
    },
    staleTime: 10 * 60 * 1000,
  })
}
