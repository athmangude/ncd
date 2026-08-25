import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

export interface EmergencyCardData {
  patientName: string
  conditions: string[]
  allergies: string[]
  bloodType: string | null
  currentMedications: {
    name: string
    dosage: string
  }[]
  emergencyContacts: EmergencyContact[]
  insuranceProvider: string | null
  insurancePolicyNumber: string | null
}

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
