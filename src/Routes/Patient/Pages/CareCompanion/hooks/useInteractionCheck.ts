import { useQuery } from "@tanstack/react-query"

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
      return {
        interactions: [],
        checkedAt: new Date().toISOString(),
        hasSevereInteractions: false,
      } as InteractionCheckData
    },
    staleTime: 10 * 60 * 1000,
  })
}
