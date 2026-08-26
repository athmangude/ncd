import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { RefillScheduleItem } from "@/types/care-companion"

export interface RefillScheduleData {
  schedules: RefillScheduleItem[]
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
