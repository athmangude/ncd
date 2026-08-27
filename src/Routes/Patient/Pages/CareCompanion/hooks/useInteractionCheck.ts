import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface DrugInteraction {
  id: string
  medicationA: string
  medicationB: string
  severity: "mild" | "moderate" | "severe"
  description: string
  recommendation: string
}

export interface InteractionCheckData {
  interactions: DrugInteraction[]
  checkedAt: string
  hasSevereInteractions: boolean
}

export const interactionCheckQueryKey = "careCompanionInteractionCheck"

export function useInteractionCheck() {
  return useQuery({
    queryKey: [interactionCheckQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/interaction-check`
      )
      return response.data as InteractionCheckData
    },
    staleTime: 10 * 60 * 1000,
  })
}
