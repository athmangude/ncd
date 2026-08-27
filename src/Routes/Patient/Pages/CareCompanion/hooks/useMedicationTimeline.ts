import { useQuery } from "@tanstack/react-query"
import axios from "axios"
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

export function useMedicationTimeline({
  limit,
  offset,
  medicationId,
}: MedicationTimelineParams) {
  return useQuery({
    queryKey: [medicationTimelineQueryKey, limit, offset, medicationId ?? null],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit, offset }
      if (medicationId) {
        params.medicationId = medicationId
      }
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/medication-timeline`,
        { params }
      )
      return response.data as MedicationTimelineData
    },
    staleTime: 2 * 60 * 1000,
  })
}
