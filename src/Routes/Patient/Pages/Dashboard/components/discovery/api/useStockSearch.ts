import { useQuery } from "@tanstack/react-query"
import type { PharmacyStock, StockStatus } from "@/types/care-companion"
import { supabase } from "@/lib/supabase"

export interface StockSearchGroup {
  name: string
  entries: PharmacyStock[]
}

interface StockRow {
  facility_id: number
  medication_name: string
  unit_price: number
  in_stock: boolean
  quantity_available: number
  last_restocked_at: string | null
  updated_at: string
  facilities: {
    name: string
    latitude: number
    longitude: number
  } | null
}

function deriveStatus(inStock: boolean, qty: number): StockStatus {
  if (!inStock || qty === 0) return "OUT_OF_STOCK"
  if (qty <= 10) return "LOW_STOCK"
  return "IN_STOCK"
}

function mapRow(row: StockRow): PharmacyStock | null {
  if (!row.facilities) return null
  return {
    facilityId: row.facility_id,
    facilityName: row.facilities.name,
    medicationName: row.medication_name,
    status: deriveStatus(row.in_stock, row.quantity_available),
    lastReportedAt: row.last_restocked_at ?? row.updated_at,
    distance: null,
    lat: Number(row.facilities.latitude),
    lng: Number(row.facilities.longitude),
    priceKES: row.unit_price,
  }
}

export function useStockSearch(query: string) {
  const trimmed = query.trim()

  return useQuery({
    queryKey: ["pharmacy-stock", "search", trimmed],
    queryFn: async () => {
      const pattern = `%${trimmed}%`
      const { data, error } = await supabase
        .from("pharmacy_stock")
        .select(
          `facility_id, medication_name, unit_price, in_stock,
           quantity_available, last_restocked_at, updated_at,
           facilities (name, latitude, longitude)`,
        )
        .or(
          `medication_name.ilike.${pattern},generic_name.ilike.${pattern},brand_name.ilike.${pattern}`,
        )

      if (error || !data) return []

      const grouped = new Map<string, PharmacyStock[]>()
      for (const raw of data) {
        const entry = mapRow(raw as unknown as StockRow)
        if (!entry) continue
        const arr = grouped.get(entry.medicationName)
        if (arr) arr.push(entry)
        else grouped.set(entry.medicationName, [entry])
      }

      return Array.from(grouped.entries()).map(([name, entries]) => ({
        name,
        entries,
      }))
    },
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: [],
  })
}
