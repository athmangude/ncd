import { MessageSquarePlus } from "lucide-react"

export function ReviewsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
      <p className="text-base font-semibold text-foreground">
        Be the first to contribute!
      </p>
      <p className="text-sm text-muted-foreground max-w-[32ch]">
        Helps others know what to expect.
      </p>
    </div>
  )
}
