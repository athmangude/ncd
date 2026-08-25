import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface EmergencyTransportCreditData {
  availableCredit: number
  currency: string
  isEligible: boolean
  maxCreditLimit: number
  usedCredit: number
  nearestFacility: {
    id: string
    name: string
    distanceKm: number
    estimatedTransportCost: number
  } | null
  lastUsedAt: string | null
}

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
