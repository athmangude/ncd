import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface RecurringTestEntry {
  id: string
  testName: string
  description: string
  conditionTags: string[]
  defaultFrequencyMonths: number
  estimatedPriceKES: number
  category: string
}

export const recurringTestsQueryKey = "recurringTests"

function mapRow(row: Record<string, unknown>): RecurringTestEntry {
  return {
    id: row.id as string,
    testName: row.name as string,
    description: (row.description as string) ?? "",
    conditionTags: (row.condition_tags as string[]) ?? [],
    defaultFrequencyMonths: (row.frequency_months as number) ?? 12,
    estimatedPriceKES: (row.estimated_cost_kes as number) ?? 0,
    category: row.category as string,
  }
}

export function useRecurringTests() {
  return useQuery({
    queryKey: [recurringTestsQueryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_tests")
        .select("*")
        .order("name")
      if (error) throw error
      return (data ?? []).map(mapRow)
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
