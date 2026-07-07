import { ScrollArea } from "@/components/ScrollArea"
import { FacilityCard } from "./FacilityCard"
import { Facility } from "./types"
import { Skeleton } from "@/components/Skeleton"

interface FacilityListProps {
  filteredFacilities: Facility[]
  onFacilityClick: (facility: Facility) => void
  loading?: boolean
}

function FacilityCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-border">
      {/* Header: Title and details */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
    </div>
  )
}

export function FacilityList({
  filteredFacilities,
  onFacilityClick,
  loading,
}: FacilityListProps) {
  return (
    <div className="flex-1 overflow-hidden bg-muted">
      <ScrollArea className="h-full">
        <div className="p-4 pt-0 space-y-3 pb-20">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <FacilityCardSkeleton key={i} />
            ))
          ) : (
            <>
              {filteredFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  onClick={onFacilityClick}
                />
              ))}

              {filteredFacilities.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No facilities found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
