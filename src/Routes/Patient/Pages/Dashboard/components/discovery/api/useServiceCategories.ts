import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface ServiceCategory {
  category: string
  displayName: string
  count: number
}

interface ServiceCategoriesResponse {
  categories: ServiceCategory[]
}

const SERVICE_CATEGORIES_KEY = ["discovery", "service-categories"] as const

export function useServiceCategories() {
  return useQuery({
    queryKey: SERVICE_CATEGORIES_KEY,
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data } = await axios.get<ServiceCategoriesResponse>(
        `${import.meta.env.VITE_API_BASE_URL}/healthcare/discovery/service-categories`,
      )
      return data.categories
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
