import { UserPlus, Reply } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import { trackEvent, EVENTS } from "@/analytics"

export interface OpenSlotPrefill {
  firstName: string
  lastName: string
  phoneNumber: string
  relationship?: string
}

interface OpenSlotCardProps {
  firstName: string
  prefill: OpenSlotPrefill
  onReinviteClick?: () => void
  onInviteNewClick?: () => void
}

export function OpenSlotCard({
  firstName,
  prefill,
  onReinviteClick,
  onInviteNewClick,
}: OpenSlotCardProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <p className="font-medium text-neutral-900">Their slot is open again.</p>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <UserPlus className="mt-0.5 h-4 w-4 text-neutral-500" />
          <div className="flex-1">
            <p className="text-sm text-neutral-700">
              You can invite someone else to take this slot…
            </p>
            <Button
              variant="link"
              className="mt-1 px-0 text-purple-700"
              onClick={() => {
                if (onInviteNewClick) {
                  onInviteNewClick()
                }
                navigate("/patients/circle-setup-intro", {
                  state: { source: "network", returnPath: "/patients/network" },
                })
              }}
            >
              Invite someone else ›
            </Button>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Reply className="mt-0.5 h-4 w-4 text-neutral-500" />
          <div className="flex-1">
            <p className="text-sm text-neutral-700">
              …or send {firstName} another invite if you think they might reconsider.
            </p>
            <Button
              variant="link"
              className="mt-1 px-0 text-purple-700"
              onClick={() => {
                if (onReinviteClick) {
                  onReinviteClick()
                } else {
                  trackEvent(EVENTS.CIRCLE.MEMBER_DETAILS_REINVITE_TAPPED)
                }
                navigate("/patients/network/add-circle-member", {
                  state: { prefill },
                })
              }}
            >
              Invite {firstName} again ›
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
