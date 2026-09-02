import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSupabase, supabase } from "@/lib/supabase"
import axios from "axios"
import type { LessonProgress } from "@/mocks/domain/careCompanion"

const QUERY_KEY = "lessonProgress"

export function useLessonProgress() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Record<string, LessonProgress>> => {
      if (useSupabase) {
        const { data, error } = await supabase
          .from("education_progress")
          .select("*")
        if (error) throw error

        const result: Record<string, LessonProgress> = {}
        for (const row of data ?? []) {
          result[row.content_id] = {
            currentSection: row.current_section ?? 0,
            completed: row.completed ?? false,
            completedAt: row.completed_at ?? undefined,
          }
        }
        return result
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/lesson-progress`,
      )
      return res.data as Record<string, LessonProgress>
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
      if (useSupabase) {
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
          currentSection: data.current_section ?? 0,
          completed: data.completed ?? false,
          completedAt: data.completed_at ?? undefined,
        } as LessonProgress
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/companion/lesson-progress/${cardId}`,
        { currentSection, completed },
      )
      return res.data as LessonProgress
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })

  return { ...query, saveProgress }
}
