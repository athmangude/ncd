import { useQuery } from "@tanstack/react-query"
import { useOffline } from "@/hooks/useOffline"
import { supabase } from "@/lib/supabase"
import type { FacilityReviewAggregate } from "./types"

export function useFacilityReviews(facilityId: string | undefined) {
  const isOffline = useOffline()

  return useQuery<FacilityReviewAggregate | null>({
    queryKey: ["facility-reviews", facilityId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("facility_reviews")
        .select("nps_score")
        .eq("facility_id", Number(facilityId))
      if (error) throw error
      if (!reviews || reviews.length === 0) return null
      const avg =
        reviews.reduce((s, r) => s + r.nps_score, 0) / reviews.length
      const recommend =
        (reviews.filter((r) => r.nps_score >= 9).length / reviews.length) *
        100
      return {
        overallRating: Math.round(avg * 10) / 10,
        recommendPercent: Math.round(recommend),
        reviewCount: reviews.length,
      }
    },
    enabled: !!facilityId && !isOffline,
    staleTime: 5 * 60 * 1000,
  })
}
