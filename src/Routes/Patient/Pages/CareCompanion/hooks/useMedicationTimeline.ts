import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { TimelineEntry } from "@/types/care-companion"

export interface MedicationTimelineSummary {
  totalMedications: number
  pharmaciesUsed: number
  dateRange: {
    from: string
    to: string
  }
}

export interface MedicationTimelinePagination {
  total: number
  limit: number
  offset: number
}

export interface MedicationTimelineData {
  entries: TimelineEntry[]
  summary: MedicationTimelineSummary
  pagination: MedicationTimelinePagination
}

export interface MedicationTimelineParams {
  limit: number
  offset: number
  medicationId?: string | null
}

export const medicationTimelineQueryKey = "careCompanionMedicationTimeline"

/**
 * @deprecated Replaced by useCareHistory which fetches from events table.
 */
export function useMedicationTimeline({
  limit,
  offset,
  medicationId,
}: MedicationTimelineParams) {
  return useQuery({
    queryKey: [medicationTimelineQueryKey, limit, offset, medicationId ?? null],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*", { count: "exact" })
        .in("type", [
          "medication_purchase",
          "refill_completed",
          "prescription_filled",
        ])
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (medicationId) {
        query = query.eq("data->>medicationId", medicationId)
      }

      const { data: events, error, count } = await query
      if (error) throw error

      const entries: TimelineEntry[] = (events ?? []).map((e: any) => ({
        id: e.id,
        type: e.type,
        date: e.created_at,
        ...(e.data as Record<string, unknown>),
      })) as unknown as TimelineEntry[]

      const uniqueMeds = new Set(
        entries
          .map((e: any) => e.medicationId ?? e.medicationName)
          .filter(Boolean),
      )
      const uniquePharmacies = new Set(
        entries.map((e: any) => e.pharmacyName ?? e.facilityName).filter(Boolean),
      )
      const dates = entries.map((e) => new Date(e.date).getTime())

      return {
        entries,
        summary: {
          totalMedications: uniqueMeds.size,
          pharmaciesUsed: uniquePharmacies.size,
          dateRange: {
            from: dates.length
              ? new Date(Math.min(...dates)).toISOString()
              : new Date().toISOString(),
            to: dates.length
              ? new Date(Math.max(...dates)).toISOString()
              : new Date().toISOString(),
          },
        },
        pagination: {
          total: count ?? 0,
          limit,
          offset,
        },
      } as MedicationTimelineData
    },
    staleTime: 2 * 60 * 1000,
  })
}
