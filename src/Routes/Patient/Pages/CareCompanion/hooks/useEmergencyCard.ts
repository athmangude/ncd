import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSupabase, supabase } from "@/lib/supabase"
import type { EmergencyReferenceCard } from "@/types/care-companion"

export type EmergencyCardData = EmergencyReferenceCard

export const emergencyCardQueryKey = "careCompanionEmergencyCard"

export function useEmergencyCard() {
  return useQuery({
    queryKey: [emergencyCardQueryKey],
    queryFn: async () => {
      if (useSupabase) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("conditions")
          .single()

        const conditions = (profile?.conditions ?? []) as string[]
        const hasDiabetes = conditions.includes("DIABETES")

        return {
          conditionType: hasDiabetes ? "DIABETES" : conditions[0] ?? "DIABETES",
          title: hasDiabetes
            ? "Diabetic Emergency Card"
            : "Emergency Reference Card",
          cardId: "emergency-card-001",
          sections: [
            {
              title: "Signs of Low Blood Sugar (Hypoglycemia)",
              items: ["Shaking or trembling", "Sweating", "Dizziness or confusion", "Fast heartbeat"],
            },
            {
              title: "What to Do",
              items: ["Drink a glass of juice or sugary drink", "Eat 3-4 glucose tablets", "Rest for 15 minutes", "If no improvement, call for help"],
            },
            {
              title: "Emergency Numbers",
              items: ["Kenya Red Cross: 1199", "Ambulance: 999", "Your doctor: See profile"],
            },
          ],
        } as EmergencyCardData
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/emergency-card`
      )
      return response.data as EmergencyCardData
    },
    staleTime: 15 * 60 * 1000,
  })
}
