import { TabsContent } from "@/components/Tabs"
import { Skeleton } from "@/components/Skeleton"

export function DiscoveryHomeSkeleton() {
  return (
    <TabsContent
      value="explore"
      className="flex flex-col w-full max-h-full overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="bg-card flex flex-col gap-2 items-center p-4 w-full shrink-0">
        <div className="flex flex-col gap-1 items-center w-full">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56 mt-1" />
        </div>

        {/* Search bar placeholder */}
        <Skeleton className="h-11 w-full rounded-full" />

        {/* Location + Verified row */}
        <div className="flex items-center justify-between w-full px-2 py-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 p-4 w-full">
        {/* Active discounts row */}
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2 py-1.5 w-full">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-3 overflow-hidden pb-2">
            {[0, 1].map((i) => (
              <Skeleton
                key={i}
                className="w-[220px] h-[160px] rounded-[14px] shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Verified partners row */}
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2 py-1.5 w-full">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex flex-col gap-2 w-full">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="w-full bg-purple-50 border border-border rounded-lg p-3 flex flex-col gap-3"
              >
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-12 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
