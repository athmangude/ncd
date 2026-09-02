import { useQuery } from "@tanstack/react-query"
import { dataService } from "@/lib/data-service"
import type { RefillScheduleItem } from "@/types/care-companion"

export interface RefillScheduleData {
  schedules: RefillScheduleItem[]
}

export const refillScheduleQueryKey = "careCompanionRefillSchedule"

export function useRefillSchedule() {
  return useQuery({
    queryKey: [refillScheduleQueryKey],
    queryFn: () =>
      dataService.query<RefillScheduleData>("refill_schedules", {
        order: { column: "next_date", ascending: true },
      }),
    staleTime: 5 * 60 * 1000,
  })
}
