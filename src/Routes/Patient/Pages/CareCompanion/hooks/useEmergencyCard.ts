import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { EmergencyReferenceCard } from "@/types/care-companion"

export type EmergencyCardData = EmergencyReferenceCard

export const emergencyCardQueryKey = "careCompanionEmergencyCard"

export function useEmergencyCard() {
  return useQuery({
    queryKey: [emergencyCardQueryKey],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("conditions")
        .single()

      const conditions = (profile?.conditions ?? []) as string[]
      const hasDiabetes = conditions.includes("DIABETES")

      return {
        id: "emergency-card-001",
        conditionType: hasDiabetes ? "DIABETES" : conditions[0] ?? "DIABETES",
        locale: "en-KE",
        title: hasDiabetes
          ? "Diabetic Emergency Card"
          : "Emergency Reference Card",
        warningSymptoms: [
          { symptom: "Shaking or trembling", severity: "critical" },
          { symptom: "Sweating", severity: "critical" },
          { symptom: "Dizziness or confusion", severity: "critical" },
          { symptom: "Fast heartbeat", severity: "warning" },
          { symptom: "Blurred vision", severity: "warning" },
          { symptom: "Unusual fatigue", severity: "warning" },
        ],
        immediateActions: [
          { step: 1, action: "Drink a glass of juice or sugary drink" },
          { step: 2, action: "Eat 3-4 glucose tablets if available" },
          { step: 3, action: "Rest for 15 minutes and recheck blood sugar" },
          { step: 4, action: "If no improvement, call for help immediately" },
        ],
        whenToGoToER: [
          "Blood sugar stays below 3.9 mmol/L after treatment",
          "Loss of consciousness or seizures",
          "Unable to swallow food or drink",
          "Symptoms worsen despite taking sugar",
        ],
        doNotDo: [
          "Do not give insulin during a low blood sugar episode",
          "Do not leave the person alone if they are confused",
          "Do not give food or drink if the person is unconscious",
        ],
        version: 1,
        isPublished: true,
      } as unknown as EmergencyCardData
    },
    staleTime: 15 * 60 * 1000,
  })
}
