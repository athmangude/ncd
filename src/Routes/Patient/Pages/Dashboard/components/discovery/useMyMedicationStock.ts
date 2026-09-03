import { useQuery } from "@tanstack/react-query"
import { useIntakeProfile } from "@/Routes/Patient/Pages/CareCompanion/hooks/useIntakeProfile"
import type { PharmacyStock, StockStatus } from "@/types/care-companion"
import { supabase } from "@/lib/supabase"

export interface MedicationStockSummary {
  medicationName: string
  totalFacilities: number
  inStockCount: number
  lowStockCount: number
  outOfStockCount: number
  nearestDistance: number | null
  nearestFacility: string | null
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

export function useMyMedicationStock(enabled = true) {
  const { data: profile } = useIntakeProfile()
  const hasMeds = (profile?.treatment?.medicationNames?.length ?? 0) > 0
  const hasTests = (profile?.recurringTests?.selectedTests?.length ?? 0) > 0
  const hasItems = hasMeds || hasTests

  const allItems = [
    ...(profile?.treatment?.medicationNames ?? []),
    ...(profile?.recurringTests?.selectedTests ?? []),
  ]

  const { data: rawStock = [], isLoading } = useQuery({
    queryKey: ["care-companion", "pharmacy-stock", "profile"],
    queryFn: async () => {
      if (allItems.length === 0) return []

      const { data, error } = await supabase
        .from("pharmacy_stock")
        .select(
          `facility_id, medication_name, unit_price, in_stock,
           quantity_available, last_restocked_at, updated_at,
           facilities (name, latitude, longitude)`,
        )
        .in("medication_name", allItems)

      if (error || !data) return []

      return (data as unknown as StockRow[])
        .map(mapRow)
        .filter((entry): entry is PharmacyStock => entry !== null)
    },
    enabled: enabled && hasItems,
    staleTime: 5 * 60 * 1000,
  })

  const summaries: MedicationStockSummary[] = []

  if (hasItems && rawStock.length > 0) {
    const byMed = new Map<string, PharmacyStock[]>()
    for (const entry of rawStock) {
      const existing = byMed.get(entry.medicationName)
      if (existing) {
        existing.push(entry)
      } else {
        byMed.set(entry.medicationName, [entry])
      }
    }

    for (const [med, entries] of byMed) {
      const sorted = [...entries].sort(
        (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
      )
      summaries.push({
        medicationName: med,
        totalFacilities: entries.length,
        inStockCount: entries.filter((e) => e.status === "IN_STOCK").length,
        lowStockCount: entries.filter((e) => e.status === "LOW_STOCK").length,
        outOfStockCount: entries.filter(
          (e) => e.status === "OUT_OF_STOCK",
        ).length,
        nearestDistance: sorted[0]?.distance ?? null,
        nearestFacility: sorted[0]?.facilityName ?? null,
        entries: sorted,
      })
    }
  }

  return {
    summaries,
    rawStock,
    isLoading,
    hasMedications: hasMeds,
    hasItems,
  }
}
