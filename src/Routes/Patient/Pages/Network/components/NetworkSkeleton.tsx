import { Skeleton } from "@/components/Skeleton"

export function NetworkSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Skeleton for Invitations Received */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-32 w-40 rounded-xl shrink-0" />
          <Skeleton className="h-32 w-40 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Skeleton for Invitations Sent */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-32 w-40 rounded-xl shrink-0" />
          <Skeleton className="h-32 w-40 rounded-xl shrink-0" />
        </div>
      </div>
      
      {/* Skeleton for Active Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
