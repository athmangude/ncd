import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { CostSummary } from "@/types/care-companion"

export type { CostSummary }

export const costSummaryQueryKey = "careCompanionCostSummary"

export function useCostSummary() {
  return useQuery({
    queryKey: [costSummaryQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/cost-summary`
      )
      return response.data as CostSummary
    },
    staleTime: 5 * 60 * 1000,
  })
}
