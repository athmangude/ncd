import { useQuery } from "@tanstack/react-query"
import { useOffline } from "@/hooks/useOffline"
import type { ReviewEligibility } from "./types"

export function useReviewEligibility(facilityId: string | undefined) {
  const isOffline = useOffline()

  return useQuery<ReviewEligibility>({
    queryKey: ["facility-review-eligibility", facilityId],
    queryFn: async (): Promise<ReviewEligibility> => {
      return {
        canReview: true,
        unreviewedPaymentId: `pay-${facilityId}-mock`,
        reason: null,
      }
    },
    enabled: !!facilityId && !isOffline,
    staleTime: 0,
  })
}
