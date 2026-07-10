import { Skeleton } from "@/components/Skeleton"

/**
 * The one shared dashboard loading silhouette. Every tab's first-load state
 * renders THIS (optionally via `useDashboardFirstLoad`'s `showSkeleton`)
 * instead of a bespoke skeleton, so the loading state reads identically
 * everywhere. `sections` lets a tab hint at roughly how many blocks it has —
 * the shape and pulse stay shared.
 */
export function DashboardSkeleton({
  sections = 3,
  showHeader = true,
  className,
}: {
  /** Number of generic section blocks below the header. */
  sections?: number
  /** Whether to render the header row (avatar/title + subtitle). */
  showHeader?: boolean
  className?: string
}) {
  return (
    <div className={className ?? "flex flex-col gap-6 w-full"}>
      {showHeader && (
        <div className="flex flex-col gap-2 items-center w-full">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      )}

      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 w-full">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}
