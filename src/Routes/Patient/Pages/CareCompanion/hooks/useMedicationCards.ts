import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface MedicationCard {
  id: string
  medicationName: string
  dosage: string
  frequency: string
  nextDoseAt: string | null
  adherenceRate: number
  refillDueDate: string | null
  daysUntilRefill: number | null
  monthlyCost: number
  currency: string
  status: "on-track" | "needs-attention" | "critical"
}

export interface MedicationCardsData {
  cards: MedicationCard[]
}

export const medicationCardsQueryKey = "careCompanionMedicationCards"

export function useMedicationCards() {
  return useQuery({
    queryKey: [medicationCardsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/medication-cards`
      )
      return response.data as MedicationCardsData
    },
    staleTime: 5 * 60 * 1000,
  })
}
