import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface ServiceCategory {
  category: string
  displayName: string
  count: number
}

const SERVICE_CATEGORIES_KEY = ["discovery", "service-categories"] as const

export function useServiceCategories() {
  return useQuery({
    queryKey: SERVICE_CATEGORIES_KEY,
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
      if (error) throw error
      return (data ?? []).map((r) => ({
        category: r.category,
        displayName: r.display_name,
        count: r.count,
      }))
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
