import { useQuery } from "@tanstack/react-query"
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
