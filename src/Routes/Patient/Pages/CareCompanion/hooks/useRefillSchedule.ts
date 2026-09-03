import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { RefillScheduleItem } from "@/types/care-companion"

export interface RefillScheduleData {
  schedules: RefillScheduleItem[]
}

export const refillScheduleQueryKey = "careCompanionRefillSchedule"

const DAY_MS = 86_400_000

function computeRefillStatus(daysUntil: number, dbStatus: string) {
  if (dbStatus === "COMPLETED" || dbStatus === "CANCELLED") return dbStatus
  if (daysUntil <= 0) return "OVERDUE"
  if (daysUntil <= 3) return "DUE"
  return "UPCOMING"
}

export function useRefillSchedule() {
  return useQuery({
    queryKey: [refillScheduleQueryKey],
    queryFn: async (): Promise<RefillScheduleData> => {
      const { data, error } = await supabase
        .from("refill_schedules")
        .select("*")
        .order("next_date", { ascending: true })
      if (error) throw error
      const now = new Date()
      const schedules: RefillScheduleItem[] = (data ?? []).map((r: any) => {
        const days = Math.ceil(
          (new Date(r.next_date).getTime() - now.getTime()) / DAY_MS,
        )
        return {
          id: r.id,
          medicationName: r.medication_name,
          expectedRefillDate: r.next_date,
          status: computeRefillStatus(days, r.status) as RefillScheduleItem["status"],
          daysUntilRefill: days,
          estimatedDaysSupply: r.frequency_days,
          escalatedToLoanOffer: false,
        }
      })
      return { schedules }
    },
    staleTime: 5 * 60 * 1000,
  })
}
