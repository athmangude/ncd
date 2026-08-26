import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { CostBreakdownResponse } from "@/types/care-companion"

export type { CostBreakdownResponse }

export const costBreakdownQueryKey = "careCompanionCostBreakdown"

export function useCostBreakdown() {
  return useQuery({
    queryKey: [costBreakdownQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/cost-breakdown`
      )
      return response.data as CostBreakdownResponse
    },
    staleTime: 5 * 60 * 1000,
  })
}
