import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface MedicationTimelineEntry {
  id: string
  medicationName: string
  dosage: string
  scheduledAt: string
  takenAt: string | null
  status: "taken" | "missed" | "upcoming" | "skipped"
  notes: string | null
}

export interface MedicationTimelineData {
  entries: MedicationTimelineEntry[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface MedicationTimelineParams {
  limit: number
  offset: number
}

export const medicationTimelineQueryKey = "careCompanionMedicationTimeline"

export function useMedicationTimeline({
  limit,
  offset,
}: MedicationTimelineParams) {
  return useQuery({
    queryKey: [medicationTimelineQueryKey, limit, offset],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/medication-timeline`,
        { params: { limit, offset } }
      )
      return response.data as MedicationTimelineData
    },
    staleTime: 2 * 60 * 1000,
  })
}
