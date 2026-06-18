import type { ReviewEligibilityReason } from "./types"

interface ReviewGateHelperTextProps {
  reason: ReviewEligibilityReason
}

const COPY: Record<ReviewEligibilityReason, string> = {
  NO_SUCCESSFUL_PAYMENT: "Pay at this facility to leave a review.",
  ALL_PAYMENTS_REVIEWED:
    "You've reviewed all your visits here. Pay again to leave a new review.",
}

export function ReviewGateHelperText({ reason }: ReviewGateHelperTextProps) {
  return (
    <p className="text-xs text-muted-foreground text-center w-full mb-2">
      {COPY[reason]}
    </p>
  )
}
