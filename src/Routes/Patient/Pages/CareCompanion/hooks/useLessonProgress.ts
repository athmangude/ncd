import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { LessonProgress } from "@/types/education"

const QUERY_KEY = "lessonProgress"

export function useLessonProgress() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Record<string, LessonProgress>> => {
      const { data, error } = await supabase
        .from("education_progress")
        .select("*")
      if (error) throw error

      const result: Record<string, LessonProgress> = {}
      for (const row of data ?? []) {
        result[row.content_id] = {
          cardId: row.content_id,
          currentSection: row.current_section ?? 0,
          completed: row.completed ?? false,
          lastAccessedAt: row.completed_at ?? new Date().toISOString(),
        }
      }
      return result
    },
    staleTime: 60_000,
  })

  const saveProgress = useMutation({
    mutationFn: async ({
      cardId,
      currentSection,
      completed,
    }: {
      cardId: string
      currentSection: number
      completed: boolean
    }) => {
      const upsertData: Record<string, unknown> = {
        content_id: cardId,
        current_section: currentSection,
        completed,
      }
      if (completed) {
        upsertData.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from("education_progress")
        .upsert(upsertData, { onConflict: "user_id,content_id" })
        .select()
        .single()
      if (error) throw error

      if (completed) {
        await supabase.functions.invoke("generate-ai-insights", {
          body: {
            trigger: "course_complete",
            triggerData: { courseSlug: cardId, courseTitle: cardId },
          },
        }).catch(() => {})
      }

      return {
        cardId: cardId,
        currentSection: data.current_section ?? 0,
        completed: data.completed ?? false,
        lastAccessedAt: data.completed_at ?? new Date().toISOString(),
      } as LessonProgress
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })

  return { ...query, saveProgress }
}
