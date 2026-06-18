export type ReviewEligibilityReason =
  | "NO_SUCCESSFUL_PAYMENT"
  | "ALL_PAYMENTS_REVIEWED"

export interface ReviewEligibility {
  canReview: boolean
  unreviewedPaymentId: string | null
  reason: ReviewEligibilityReason | null
}

export interface FacilityReviewAggregate {
  overallRating: number
  recommendPercent: number
  reviewCount: number
}

export interface SubmitReviewPayload {
  paymentId: string
  npsScore: number
  lovedMost?: string
  couldDoBetter?: string
  makeItATen?: string
}
