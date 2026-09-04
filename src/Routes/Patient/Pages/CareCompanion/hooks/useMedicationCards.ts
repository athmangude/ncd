import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  MedicationCard as DomainMedicationCard,
  InteractionSeverity,
  MedicationCategory,
  ConditionType,
} from "@/types/care-companion"

export interface AnnotatedInteraction {
  withMedication: string
  severity: InteractionSeverity
  description: string
  recommendation: string
}

export interface AnnotatedMedicationCard {
  card: DomainMedicationCard
  interactions: AnnotatedInteraction[]
  /** Resolved from taxonomy for display */
  genericName: string
  slug: string
  brandNames: string[]
  category: MedicationCategory
  strengths: string[]
  conditionTags: ConditionType[]
}

export interface MedicationCardsData {
  cards: AnnotatedMedicationCard[]
  pagination: { total: number; limit: number; offset: number }
}

export const medicationCardsQueryKey = "careCompanionMedicationCards"

export function useMedicationCards() {
  return useQuery({
    queryKey: [medicationCardsQueryKey],
    queryFn: async (): Promise<MedicationCardsData> => {
      const { data, error } = await supabase
        .from("medication_cards")
        .select("*")
      if (error) throw error

      const slugToName = (slug: string) =>
        slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())

      const enrichedCards: AnnotatedMedicationCard[] = (data ?? []).map(
        (row: Record<string, unknown>) => {
          const content = (row.content ?? {}) as Record<string, unknown>
          const card: DomainMedicationCard = {
            id: row.id as string,
            medicationId: (row.medication_id ?? "") as string,
            slug: (row.slug ?? "") as string,
            ...(content as Record<string, unknown>),
          } as DomainMedicationCard
          const isCustomId = card.medicationId?.startsWith("custom-")
          return {
            card,
            interactions: [],
            genericName: (content.genericName as string) ?? slugToName(card.slug),
            slug: card.slug,
            brandNames: (content.brandNames ?? []) as string[],
            category: ((content.category ?? (isCustomId ? "LAB_TEST" : "MEDICATION")) as MedicationCategory),
            strengths: (content.strengths ?? []) as string[],
            conditionTags: (content.conditionTags ?? []) as ConditionType[],
          }
        },
      )

      return {
        cards: enrichedCards,
        pagination: { total: enrichedCards.length, limit: 500, offset: 0 },
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
