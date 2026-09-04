import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface MedicationTaxonomyEntry {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: string
  conditionTags: string[]
  priceKES: number | null
  dosageForm: string | null
  subCategory: string | null
  isControlled: boolean
  requiresPrescription: boolean
}

export const medicationTaxonomyQueryKey = "medicationTaxonomy"

function mapRow(row: Record<string, unknown>): MedicationTaxonomyEntry {
  return {
    id: row.id as string,
    genericName: (row.generic_name as string) ?? (row.name as string),
    brandNames: (row.common_brands as string[]) ?? [],
    strengths: (row.strength as string) ? [row.strength as string] : [],
    category: row.category as string,
    conditionTags: (row.condition_tags as string[]) ?? [],
    priceKES: row.price_kes as number | null,
    dosageForm: row.dosage_form as string | null,
    subCategory: row.sub_category as string | null,
    isControlled: (row.is_controlled as boolean) ?? false,
    requiresPrescription: (row.requires_prescription as boolean) ?? false,
  }
}

export function useMedicationTaxonomy() {
  return useQuery({
    queryKey: [medicationTaxonomyQueryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medication_taxonomy")
        .select("*")
        .order("name")
      if (error) throw error
      return (data ?? []).map(mapRow)
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function getMedicationPrice(
  taxonomy: MedicationTaxonomyEntry[],
  name: string,
): number {
  const normalised = name.toLowerCase().trim()
  const match = taxonomy.find(
    (m) => m.genericName.toLowerCase() === normalised,
  )
  return match?.priceKES ?? 500
}
