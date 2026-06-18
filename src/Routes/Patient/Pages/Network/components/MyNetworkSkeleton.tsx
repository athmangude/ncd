import { Skeleton } from "@/components/Skeleton"

export function MyNetworkSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Invite Card Skeleton */}
      <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
        <div className="flex gap-4 items-start mb-4">
          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-md" />
          <Skeleton className="h-12 rounded-md" />
        </div>
      </div>

      {/* Invitations Received Skeleton - Optional, maybe just show one section */}
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

      {/* Active Members Skeleton */}
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
