import { RatingPeopleBar } from "./RatingPeopleBar"
import type { FacilityReviewAggregate } from "./types"

interface ReviewsAggregateProps {
  aggregate: FacilityReviewAggregate
}

export function ReviewsAggregate({ aggregate }: ReviewsAggregateProps) {
  const { overallRating, recommendPercent, reviewCount } = aggregate

  return (
    <div className="flex flex-col items-center gap-6 py-10 px-6">
      <RatingPeopleBar score={overallRating} />

      <div className="flex items-start justify-center gap-10 text-center">
        <div className="flex flex-col items-center max-w-[10ch]">
          <span className="text-3xl font-semibold text-foreground">
            {recommendPercent}%
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            would recommend this provider
          </span>
        </div>

        <div className="flex flex-col items-center max-w-[10ch]">
          <span className="text-xs text-muted-foreground">Overall rating:</span>
          <span className="text-3xl font-semibold text-foreground">
            {overallRating.toFixed(1)}
            <span className="text-base text-muted-foreground">/10</span>
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>
    </div>
  )
}
