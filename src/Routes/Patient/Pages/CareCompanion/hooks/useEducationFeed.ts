import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export interface EducationArticle {
  id: string
  title: string
  summary: string
  thumbnailUrl: string
  contentUrl: string
  category: string
  readTimeMinutes: number
  publishedAt: string
  viewed: boolean
  viewedAt: string | null
}

export interface EducationFeedData {
  articles: EducationArticle[]
  totalUnread: number
}

export const educationFeedQueryKey = "careCompanionEducationFeed"

export function useEducationFeed() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [educationFeedQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/education-feed`
      )
      return response.data as EducationFeedData
    },
    staleTime: 5 * 60 * 1000,
  })

  const markViewed = useMutation({
    mutationFn: async (articleId: string) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/education-feed/${articleId}/viewed`
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
