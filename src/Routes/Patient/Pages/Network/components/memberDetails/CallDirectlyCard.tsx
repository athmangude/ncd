import { ChevronRight } from "lucide-react"
import { trackEvent, EVENTS } from "@/analytics"
import callDirectlyIllustration from "@/assets/images/circle-call-directly.png"

interface CallDirectlyCardProps {
  phoneNumber: string | null
}

export function CallDirectlyCard({ phoneNumber }: CallDirectlyCardProps) {
  if (!phoneNumber) return null
  return (
    <div className="flex items-center gap-4 rounded-md bg-purple-50 px-4 py-2.5">
      <img
        src={callDirectlyIllustration}
        alt=""
        aria-hidden
        className="h-[84px] w-[75px] shrink-0 object-contain"
      />
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <p className="text-base font-medium leading-6 text-foreground">
            Call them directly
          </p>
          <p className="text-sm text-muted-foreground">on {phoneNumber}</p>
        </div>
        <a
          href={`tel:${phoneNumber}`}
          onClick={() => trackEvent(EVENTS.CIRCLE.MEMBER_DETAILS_CALL_TAPPED)}
          className="inline-flex items-center gap-1 self-start rounded-sm bg-purple-100 px-2 py-1 text-sm font-medium text-purple-800"
        >
          Call now
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
