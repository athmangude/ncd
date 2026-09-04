import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  CostBreakdownResponse,
  CostCategoryBreakdown,
  MedicationCategory,
  MonthlySpend,
} from "@/types/care-companion"

export type { CostBreakdownResponse }

export const costBreakdownQueryKey = "careCompanionCostBreakdown"

interface PaymentRow {
  amount: number
  line_items: Array<{ category: MedicationCategory; total: number }> | null
  created_at: string
}

export function useCostBreakdown() {
  return useQuery({
    queryKey: [costBreakdownQueryKey],
    queryFn: async (): Promise<CostBreakdownResponse> => {
      const year = new Date().getFullYear()
      const startOfYear = new Date(year, 0, 1).toISOString()
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, line_items, created_at")
        .gte("created_at", startOfYear)
      if (error) throw error

      const rows = (payments ?? []) as PaymentRow[]

      const catMap = new Map<MedicationCategory, { total: number; count: number }>()
      let grandTotal = 0
      for (const p of rows) {
        if (p.line_items) {
          for (const li of p.line_items) {
            const cat = li.category ?? ("OTHER" as MedicationCategory)
            const entry = catMap.get(cat) ?? { total: 0, count: 0 }
            entry.total += Number(li.total ?? 0)
            entry.count += 1
            catMap.set(cat, entry)
            grandTotal += Number(li.total ?? 0)
          }
        } else {
          grandTotal += Number(p.amount)
        }
      }

      const categories: CostCategoryBreakdown[] = Array.from(
        catMap.entries(),
      ).map(([category, { total, count }]) => ({
        category,
        totalSpend: total.toFixed(2),
        percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
        transactionCount: count,
      }))

      const monthMap = new Map<number, number>()
      for (const p of rows) {
        const month = new Date(p.created_at).getMonth() + 1
        monthMap.set(month, (monthMap.get(month) ?? 0) + Number(p.amount))
      }
      const monthlyTrend: MonthlySpend[] = Array.from(
        monthMap.entries(),
      )
        .sort(([a], [b]) => a - b)
        .map(([month, spend]) => ({ month, spend: spend.toFixed(2) }))

      return {
        year,
        categories,
        monthlyTrend,
        pagination: { total: rows.length, limit: 500, offset: 0 },
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
