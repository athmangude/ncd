import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface Medication {
  id: string
  name: string
  genericName: string | null
  dosage: string
  frequency: string
  route: string
  prescribedBy: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  refillDueDate: string | null
  remainingQuantity: number | null
}

export interface MedicationListData {
  medications: Medication[]
  totalActive: number
  totalInactive: number
}

export const medicationListQueryKey = "careCompanionMedicationList"

export function useMedicationList() {
  return useQuery({
    queryKey: [medicationListQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/medications`
      )
      return response.data as MedicationListData
    },
    staleTime: 5 * 60 * 1000,
  })
}
