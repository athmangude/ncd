import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface RefillItem {
  id: string
  medicationName: string
  dosage: string
  dueDate: string
  daysUntilDue: number
  estimatedCost: number
  currency: string
  pharmacyName: string | null
  pharmacyId: string | null
  status: "upcoming" | "due-soon" | "overdue"
}

export interface RefillScheduleData {
  refills: RefillItem[]
  totalEstimatedCost: number
  currency: string
}

export const refillScheduleQueryKey = "careCompanionRefillSchedule"

export function useRefillSchedule() {
  return useQuery({
    queryKey: [refillScheduleQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/refill-schedule`
      )
      return response.data as RefillScheduleData
    },
    staleTime: 5 * 60 * 1000,
  })
}
