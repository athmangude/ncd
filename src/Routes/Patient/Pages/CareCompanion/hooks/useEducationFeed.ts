import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/education-cards`
      )
      return response.data as EducationFeedData
    },
    staleTime: 5 * 60 * 1000,
  })

  const markViewed = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/companion/education-feed/${cardId}/viewed`
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
