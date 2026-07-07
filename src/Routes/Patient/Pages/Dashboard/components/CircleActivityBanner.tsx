import { ChevronRight, Send, UserRoundPlus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import { useToast } from "@/hooks/useToast"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import type { BannerState } from "../hooks/useCircleStatus"
import { useSendInviteReminders } from "../hooks/useSendInviteReminders"
import { useAcknowledgeActivity } from "../hooks/useAcknowledgeActivity"

export interface CircleActivityBannerProps {
  banner: BannerState
}

export function CircleActivityBanner({ banner }: CircleActivityBannerProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const sendReminders = useSendInviteReminders()
  const acknowledgeActivity = useAcknowledgeActivity()

  if (banner.variant === "SET_UP_CIRCLE") {
    return (
      <button
        type="button"
        data-testid="set-up-circle-banner"
        onClick={() => navigate("/patients/circle?add=1")}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700"
      >
        <span>Set up your Circle</span>
        <UserRoundPlus className="h-4 w-4 text-purple-700" />
      </button>
    )
  }

  if (banner.variant === "PENDING_INVITES") {
    const label =
      banner.count === 1
        ? "Send reminders to 1 person"
        : `Send reminders to ${banner.count} people`

    const onClick = async () => {
      try {
        const res = await sendReminders.mutateAsync()
        if (res.throttled && res.sent === 0) {
          toast({
            title: "Reminders not sent",
            description:
              "You've already sent reminders recently. Try again in a little while.",
          })
        } else if (res.throttled) {
          toast({
            title: "Some reminders not sent",
            description: `Sent ${res.sent}. Others were skipped because they were reminded recently.`,
          })
        } else {
          toast({
            title: "Reminders sent",
            description: `Reminded ${res.sent} ${
              res.sent === 1 ? "person" : "people"
            }.`,
          })
        }
      } catch {
        toast({
          title: "Couldn't send reminders",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    }

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={sendReminders.isPending}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-full bg-purple-100 px-4 py-3 text-sm font-medium text-purple-700 disabled:opacity-50"
      >
        <span>{label}</span>
        <Send className="h-4 w-4" />
      </button>
    )
  }

  if (banner.variant === "INVITE_DECLINED") {
    const { member, inviteId } = banner
    return (
      <button
        type="button"
        data-testid="invite-declined-banner"
        onClick={() => {
          trackEvent(EVENTS.CIRCLE.INVITE_REJECTED_BANNER_TAPPED)
          navigate(`/patients/network/invite-rejected/${inviteId}`)
        }}
        className={cn(
          "mt-3 w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left",
          "bg-red-50 border-red-100",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <ProfileAvatar
              src={member.avatarUrl}
              name={`${member.firstName} ${member.lastName}`}
              firstName={member.firstName}
              lastName={member.lastName}
              className="h-8 w-8"
              fallbackClassName="text-xs"
            />
            <span
              data-testid="banner-dot"
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
                "border-2 border-white",
                "bg-red-500",
              )}
            />
          </div>
          <span className="text-sm text-foreground">
            {member.firstName} declined your invite.
          </span>
        </div>
        <ChevronRight className={cn("h-5 w-5 shrink-0", "text-red-600")} />
      </button>
    )
  }

  // MEMBER_JOINED or MEMBER_LEFT
  const member = banner.member
  const isJoin = banner.variant === "MEMBER_JOINED"
  const copy = isJoin
    ? `${member.firstName} joined your Circle.`
    : `${member.firstName} has left your Circle`
  const containerClass = isJoin
    ? "bg-green-50 border-green-100"
    : "bg-red-50 border-red-100"
  const dotClass = isJoin ? "bg-green-500" : "bg-red-500"
  const chevronClass = isJoin ? "text-green-600" : "text-red-600"
  const onTap = () => {
    if (!isJoin && banner.variant === "MEMBER_LEFT") {
      acknowledgeActivity.mutate(banner.eventId)
    }
    navigate(`/patients/network/${member.id}`)
  }

  return (
    <button
      type="button"
      data-testid={isJoin ? "joined-banner" : "left-banner"}
      onClick={onTap}
      className={cn(
        "mt-3 w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left",
        containerClass,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <ProfileAvatar
            src={member.avatarUrl}
            name={`${member.firstName} ${member.lastName}`}
            firstName={member.firstName}
            lastName={member.lastName}
            className="h-8 w-8"
            fallbackClassName="text-xs"
          />
          <span
            data-testid="banner-dot"
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
              "border-2 border-white",
              dotClass,
            )}
          />
        </div>
        <span className="text-sm text-foreground">{copy}</span>
      </div>
      <ChevronRight className={cn("h-5 w-5 shrink-0", chevronClass)} />
    </button>
  )
}
