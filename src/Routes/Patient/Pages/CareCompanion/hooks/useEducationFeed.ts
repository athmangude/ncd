import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSupabase, supabase } from "@/lib/supabase"
import axios from "axios"
import type {
  EducationContentCard,
} from "@/types/care-companion"

export interface EducationFeedCard extends EducationContentCard {
  viewed: boolean
}

export interface EducationFeedData {
  cards: EducationFeedCard[]
}

export const educationFeedQueryKey = "careCompanionEducationFeed"

export function useEducationFeed() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [educationFeedQueryKey],
    queryFn: async (): Promise<EducationFeedData> => {
      if (useSupabase) {
        const { data: content, error } = await supabase
          .from("education_content")
          .select("*")
        if (error) throw error

        const { data: progress } = await supabase
          .from("education_progress")
          .select("content_id, completed")

        const progressMap = new Map(
          (progress ?? []).map((p) => [p.content_id, p.completed]),
        )

        const cards: EducationFeedCard[] = (content ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          slug: row.slug as string,
          conditionType: ((row.conditions as string[] | null)?.[0] ?? "DIABETES") as EducationContentCard["conditionType"],
          contentType: (row.content_type ?? "NUTRITION") as EducationContentCard["contentType"],
          locale: "en" as EducationContentCard["locale"],
          title: (row.title ?? "") as string,
          summary: (row.summary ?? "") as string,
          body: (row.body ?? "") as string,
          sections: (row.sections ?? []) as EducationContentCard["sections"],
          estimatedMinutes: (row.estimated_minutes ?? 5) as number,
          learningObjectives: (row.learning_objectives ?? []) as string[],
          weekNumber: 1,
          imageUrl: (row.image_theme ?? null) as string | null,
          isPublished: true,
          householdCompatible: null,
          costNeutral: null,
          viewed: progressMap.get(row.id as string) ?? false,
        }))

        return { cards }
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/education-cards`,
      )
      return response.data as EducationFeedData
    },
    staleTime: 5 * 60 * 1000,
  })

  const markViewed = useMutation({
    mutationFn: async (cardId: string) => {
      if (useSupabase) {
        const { error } = await supabase
          .from("education_progress")
          .upsert(
            { content_id: cardId, current_section: 0 },
            { onConflict: "user_id,content_id" },
          )
        if (error) throw error
        return
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/companion/education-feed/${cardId}/viewed`,
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [educationFeedQueryKey] })
    },
  })

  return {
    ...query,
    markViewed,
  }
}
