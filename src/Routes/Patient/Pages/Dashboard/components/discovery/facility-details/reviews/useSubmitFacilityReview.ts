import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { SubmitReviewPayload } from "./types"

interface SubmitArgs {
  facilityId: string
  payload: SubmitReviewPayload
}

export function useSubmitFacilityReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ facilityId, payload }: SubmitArgs) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/patients/facilities/${facilityId}/reviews`,
        payload
      )
      return response.data as { message: string }
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
