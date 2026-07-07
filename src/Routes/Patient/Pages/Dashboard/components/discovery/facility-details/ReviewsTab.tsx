import { Skeleton } from "@/components/Skeleton"
import { ReviewsAggregate } from "./reviews/ReviewsAggregate"
import { ReviewsEmptyState } from "./reviews/ReviewsEmptyState"
import type { FacilityReviewAggregate } from "./reviews/types"

interface ReviewsTabProps {
  aggregate: FacilityReviewAggregate | null | undefined
  isLoading: boolean
}

export function ReviewsTab({ aggregate, isLoading }: ReviewsTabProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 px-6">
        <Skeleton className="h-7 w-64 bg-muted rounded" />
        <Skeleton className="h-6 w-48 bg-muted rounded mt-3" />
      </div>
    )
  }

  if (!aggregate) return <ReviewsEmptyState />

  return <ReviewsAggregate aggregate={aggregate} />
}
