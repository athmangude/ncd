import { useQuery } from "@tanstack/react-query"
import { useIntakeProfile } from "@/Routes/Patient/Pages/CareCompanion/hooks/useIntakeProfile"
import type { PharmacyStock } from "@/types/care-companion"
import { supabase } from "@/lib/supabase"
import {
  getProfileAwarePharmacyStock,
  type StockFacility,
} from "@/mocks/domain/careCompanion"

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
      const { data } = await supabase
        .from("facilities")
        .select("id, name, latitude, longitude, verification_status")
      if (!data) return []
      const facilities: StockFacility[] = data.map((f) => ({
        id: String(f.id),
        name: f.name,
        latitude: String(f.latitude),
        longitude: String(f.longitude),
        verificationStatus: f.verification_status,
      }))
      return getProfileAwarePharmacyStock(allItems, facilities)
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
