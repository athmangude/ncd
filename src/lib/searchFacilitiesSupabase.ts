import { supabase } from "@/lib/supabase"
import { mapFacilityRow } from "@/Routes/Patient/Pages/Dashboard/components/discovery/mappers"
import type { FacilityRow } from "@/Routes/Patient/Pages/Dashboard/components/discovery/mappers"

export async function searchFacilitiesSupabase(query: string) {
  if (!query.trim()) {
    return { facilities: [], total: 0, query }
  }

  const orFilters = [
    `name.ilike.%${query}%`,
    `county.ilike.%${query}%`,
    `location_name.ilike.%${query}%`,
    `facility_type.ilike.%${query}%`,
  ].join(",")

  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .or(orFilters)
    .order("name")

  if (error) throw error

  const facilities = ((data ?? []) as FacilityRow[]).map(mapFacilityRow)

  return { facilities, total: facilities.length, query }
}
