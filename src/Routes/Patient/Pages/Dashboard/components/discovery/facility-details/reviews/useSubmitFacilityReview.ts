import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { SubmitReviewPayload } from "./types"

interface SubmitArgs {
  facilityId: string
  payload: SubmitReviewPayload
}

export function useSubmitFacilityReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ facilityId, payload }: SubmitArgs) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      const { error } = await supabase.from("facility_reviews").insert({
        id: `rev-${Date.now().toString(36)}`,
        facility_id: Number(facilityId),
        user_id: user.id,
        payment_id: payload.paymentId,
        nps_score: payload.npsScore,
        loved_most: payload.lovedMost ?? null,
        could_do_better: payload.couldDoBetter ?? null,
        make_it_a_ten: payload.makeItATen ?? null,
      })
      if (error) throw error
      return { message: "Review submitted" }
    },
    onSuccess: (_data, { facilityId }) => {
      queryClient.invalidateQueries({
        queryKey: ["facility-review-eligibility", facilityId],
      })
      queryClient.invalidateQueries({
        queryKey: ["facility-reviews", facilityId],
      })
    },
  })
}
