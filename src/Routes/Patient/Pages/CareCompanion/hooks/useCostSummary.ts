import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface CostSummaryData {
  monthlyTotal: number
  previousMonthTotal: number
  percentageChange: number
  currency: string
  period: {
    start: string
    end: string
  }
  categories: {
    name: string
    amount: number
    percentage: number
  }[]
}

export const costSummaryQueryKey = "careCompanionCostSummary"

export function useCostSummary() {
  return useQuery({
    queryKey: [costSummaryQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/cost-summary`
      )
      return response.data as CostSummaryData
    },
    staleTime: 5 * 60 * 1000,
  })
}
