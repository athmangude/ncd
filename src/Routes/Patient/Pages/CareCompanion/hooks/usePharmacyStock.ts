import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { PharmacyStock } from "@/types/care-companion"

export const pharmacyStockQueryKey = "careCompanionPharmacyStock"

export function usePharmacyStock() {
  return useQuery({
    queryKey: [pharmacyStockQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/pharmacy-stock`,
      )
      return response.data as PharmacyStock[]
    },
    staleTime: 10 * 60 * 1000,
  })
}
