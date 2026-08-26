import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { EmergencyTransportCredit } from "@/types/care-companion"

export type EmergencyTransportCreditData = EmergencyTransportCredit

export const emergencyTransportCreditQueryKey =
  "careCompanionEmergencyTransportCredit"

export function useEmergencyTransportCredit() {
  return useQuery({
    queryKey: [emergencyTransportCreditQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/emergency-transport-credit`
      )
      return response.data as EmergencyTransportCreditData
    },
    staleTime: 10 * 60 * 1000,
  })
}
