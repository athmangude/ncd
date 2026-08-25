import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface PharmacyStockItem {
  medicationName: string
  dosage: string
  inStock: boolean
  price: number | null
  currency: string
  lastCheckedAt: string
}

export interface PharmacyStockEntry {
  pharmacyId: string
  pharmacyName: string
  distanceKm: number | null
  items: PharmacyStockItem[]
}

export interface PharmacyStockData {
  pharmacies: PharmacyStockEntry[]
  checkedAt: string
}

export const pharmacyStockQueryKey = "careCompanionPharmacyStock"

export function usePharmacyStock() {
  return useQuery({
    queryKey: [pharmacyStockQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/pharmacy-stock`
      )
      return response.data as PharmacyStockData
    },
    staleTime: 10 * 60 * 1000,
  })
}
