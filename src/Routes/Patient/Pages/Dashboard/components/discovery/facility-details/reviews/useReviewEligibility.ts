import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useOffline } from "@/hooks/useOffline"
import type { ReviewEligibility } from "./types"

export function useReviewEligibility(facilityId: string | undefined) {
  const isOffline = useOffline()

  return useQuery<ReviewEligibility>({
    queryKey: ["facility-review-eligibility", facilityId],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/patients/facilities/${facilityId}/review-eligibility`
      )
      return response.data as ReviewEligibility
    },
    enabled: !!facilityId && !isOffline,
    staleTime: 0,
  })
}
