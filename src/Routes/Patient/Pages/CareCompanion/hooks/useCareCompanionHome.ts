import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface CareCompanionHomeData {
  patientName: string
  intakeCompleted: boolean
  medicationCount: number
  nextRefillDate: string | null
  costSummary: {
    monthlyTotal: number
    currency: string
  }
  activeAlerts: {
    id: string
    type: string
    message: string
    severity: "info" | "warning" | "critical"
  }[]
  educationHighlight: {
    id: string
    title: string
    thumbnailUrl: string
  } | null
}

export const careCompanionHomeQueryKey = "careCompanionHome"

export function useCareCompanionHome() {
  return useQuery({
    queryKey: [careCompanionHomeQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/home`
      )
      return response.data as CareCompanionHomeData
    },
    staleTime: 5 * 60 * 1000,
  })
}
