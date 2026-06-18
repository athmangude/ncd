import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useOffline } from "@/hooks/useOffline"
import type { FacilityReviewAggregate } from "./types"

export function useFacilityReviews(facilityId: string | undefined) {
  const isOffline = useOffline()

  return useQuery<FacilityReviewAggregate | null>({
    queryKey: ["facility-reviews", facilityId],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/facilities/${facilityId}/reviews/aggregate`,
        { validateStatus: (s) => s === 200 || s === 204 }
      )
      if (response.status === 204) return null
      return response.data as FacilityReviewAggregate
    },
    enabled: !!facilityId && !isOffline,
    staleTime: 5 * 60 * 1000,
  })
}
