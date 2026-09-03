import { useQuery } from "@tanstack/react-query"
import { useSupabase, supabase } from "@/lib/supabase"
import axios from "axios"
import type {
  MedicationCard as DomainMedicationCard,
  InteractionSeverity,
  MedicationTaxonomyEntry,
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

interface RawCardResponse {
  cards: {
    card: DomainMedicationCard
    interactions: AnnotatedInteraction[]
  }[]
  pagination: { total: number; limit: number; offset: number }
}

export const medicationCardsQueryKey = "careCompanionMedicationCards"

export function useMedicationCards() {
  return useQuery({
    queryKey: [medicationCardsQueryKey],
    queryFn: async (): Promise<MedicationCardsData> => {
      if (useSupabase) {
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
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL

      const [cardsRes, taxonomyRes] = await Promise.all([
        axios.get(`${baseUrl}/companion/medication-cards`),
        axios.get(`${baseUrl}/api/medications/taxonomy`, { params: { limit: 500 } }),
      ])

      const rawCards = cardsRes.data as RawCardResponse
      const taxonomy = taxonomyRes.data as MedicationTaxonomyEntry[]

      const slugToName = (slug: string) =>
        slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())

      const enrichedCards: AnnotatedMedicationCard[] = rawCards.cards.map(
        ({ card, interactions }) => {
          const taxEntry =
            taxonomy.find((t) => t.id === card.medicationId) ??
            taxonomy.find(
              (t) =>
                t.genericName
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "") === card.slug,
            )
          const isCustomId = card.medicationId.startsWith("custom-")
          return {
            card,
            interactions,
            genericName: taxEntry?.genericName ?? slugToName(card.slug),
            slug: card.slug,
            brandNames: taxEntry?.brandNames ?? [],
            category: taxEntry?.category ?? (isCustomId ? "LAB_TEST" : "MEDICATION"),
            strengths: taxEntry?.strengths ?? [],
            conditionTags: taxEntry?.conditionTags ?? [],
          }
        },
      )

      return {
        cards: enrichedCards,
        pagination: rawCards.pagination,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
