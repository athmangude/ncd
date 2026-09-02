import { useQuery } from "@tanstack/react-query"
import { useSupabase, supabase } from "@/lib/supabase"
import axios from "axios"
import type { CostSummary } from "@/types/care-companion"

export type { CostSummary }

export const costSummaryQueryKey = "careCompanionCostSummary"

export function useCostSummary() {
  return useQuery({
    queryKey: [costSummaryQueryKey],
    queryFn: async (): Promise<CostSummary> => {
      if (!useSupabase) {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/companion/cost-summary`,
        )
        return response.data as CostSummary
      }

      const startOfYear = new Date(
        new Date().getFullYear(),
        0,
        1,
      ).toISOString()
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, cashback_amount, created_at")
        .gte("created_at", startOfYear)
      if (error) throw error

      const rows = payments ?? []
      const ytdSpend = rows.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      )
      const cashbackEarned = rows.reduce(
        (sum, p) => sum + Number(p.cashback_amount ?? 0),
        0,
      )
      const netSpend = ytdSpend - cashbackEarned
      const currentMonth = new Date().getMonth() + 1
      const monthlyAverage = currentMonth > 0 ? ytdSpend / currentMonth : 0
      const annualProjection =
        currentMonth > 0 ? (ytdSpend / currentMonth) * 12 : 0

      return {
        year: new Date().getFullYear(),
        ytdSpend: ytdSpend.toFixed(2),
        monthlyAverage: monthlyAverage.toFixed(2),
        cashbackEarned: cashbackEarned.toFixed(2),
        netSpend: netSpend.toFixed(2),
        annualProjection: annualProjection.toFixed(2),
        transactionCount: rows.length,
        currency: "KES",
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
