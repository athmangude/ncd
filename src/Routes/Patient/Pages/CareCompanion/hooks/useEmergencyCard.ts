import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { EmergencyReferenceCard } from "@/types/care-companion"

export type EmergencyCardData = EmergencyReferenceCard

export const emergencyCardQueryKey = "careCompanionEmergencyCard"

export function useEmergencyCard() {
  return useQuery({
    queryKey: [emergencyCardQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/emergency-card`
      )
      return response.data as EmergencyCardData
    },
    staleTime: 15 * 60 * 1000,
  })
}
