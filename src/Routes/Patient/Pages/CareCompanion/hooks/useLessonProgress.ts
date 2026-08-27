import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { LessonProgress } from "@/mocks/domain/careCompanion"

const QUERY_KEY = "lessonProgress"

export function useLessonProgress() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
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
