import { useQuery } from "@tanstack/react-query"
import type { PharmacyStock } from "@/types/care-companion"
import { supabase } from "@/lib/supabase"
import { useIntakeProfile } from "@/Routes/Patient/Pages/CareCompanion/hooks/useIntakeProfile"
import {
  searchPharmacyStockByName,
  type StockFacility,
} from "@/mocks/domain/careCompanion"

export interface StockSearchGroup {
  name: string
  entries: PharmacyStock[]
}

export function useStockSearch(query: string) {
  const trimmed = query.trim()
  const { data: profile } = useIntakeProfile()

  const profileItems = [
    ...(profile?.treatment?.medicationNames ?? []),
    ...(profile?.recurringTests?.selectedTests ?? []),
  ]

  return useQuery({
    queryKey: ["pharmacy-stock", "search", trimmed],
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
      return searchPharmacyStockByName(trimmed, {
        profileItems,
        facilities,
      })
    },
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: [],
  })
}
