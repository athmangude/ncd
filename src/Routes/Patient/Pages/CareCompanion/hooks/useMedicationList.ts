import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface Medication {
  id: string
  name: string
  genericName: string | null
  dosage: string
  frequency: string
  route: string
  prescribedBy: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  refillDueDate: string | null
  remainingQuantity: number | null
}

export interface MedicationListData {
  medications: Medication[]
  totalActive: number
  totalInactive: number
}

export const medicationListQueryKey = "careCompanionMedicationList"

export function useMedicationList() {
  return useQuery({
    queryKey: [medicationListQueryKey],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("treatment")
        .single()

      const treatment = profile?.treatment as {
        medicationNames?: string[]
        currentlyOnMedication?: boolean
      } | null

      const { data: refills } = await supabase
        .from("refill_schedules")
        .select("medication_name, next_date, frequency_days")

      const refillMap = new Map(
        (refills ?? []).map((r: any) => [r.medication_name, r])
      )

      const medications: Medication[] = (treatment?.medicationNames ?? []).map(
        (name, i) => {
          const refill = refillMap.get(name) as any
          return {
            id: `med-${i}`,
            name,
            genericName: null,
            dosage: "",
            frequency: refill ? `Every ${refill.frequency_days} days` : "Daily",
            route: "oral",
            prescribedBy: null,
            startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
            endDate: null,
            isActive: true,
            refillDueDate: refill?.next_date ?? null,
            remainingQuantity: null,
          }
        }
      )

      return {
        medications,
        totalActive: medications.length,
        totalInactive: 0,
      } as MedicationListData
    },
    staleTime: 5 * 60 * 1000,
  })
}
