import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface CostBreakdownItem {
  id: string
  medicationName: string
  dosage: string
  unitCost: number
  quantity: number
  totalCost: number
  currency: string
  frequency: string
  pharmacyName: string | null
}

export interface CostBreakdownData {
  items: CostBreakdownItem[]
  grandTotal: number
  currency: string
}

export const costBreakdownQueryKey = "careCompanionCostBreakdown"

export function useCostBreakdown() {
  return useQuery({
    queryKey: [costBreakdownQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/cost-breakdown`
      )
      return response.data as CostBreakdownData
    },
    staleTime: 5 * 60 * 1000,
  })
}
