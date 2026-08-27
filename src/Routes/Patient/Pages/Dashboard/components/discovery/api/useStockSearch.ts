import { useQuery } from "@tanstack/react-query"
import type { PharmacyStock } from "@/types/care-companion"

export interface StockSearchGroup {
  name: string
  entries: PharmacyStock[]
}

async function fetchStockSearch(q: string): Promise<StockSearchGroup[]> {
  const res = await fetch(`/companion/pharmacy-stock/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  return res.json()
}

export function useStockSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ["pharmacy-stock", "search", trimmed],
    queryFn: () => fetchStockSearch(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: [],
  })
}
