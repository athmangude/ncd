import { useNavigate } from "react-router-dom"
import { UserRoundPlus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Chip } from "@/components/Chip"

export type CircleInviteSubType =
  | "CIRCLE_INVITE_4H_OWNER"
  | "CIRCLE_INVITE_24H_OWNER"

interface CircleInviteReminderCardProps {
  subType: CircleInviteSubType
  invitationId: string
  inviteeFirstName: string
  sentAt: string
  readStatus: "READ" | "UNREAD"
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return "now"
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d`
}

export function CircleInviteReminderCard({
  subType,
  invitationId,
  inviteeFirstName,
  sentAt,
  readStatus,
}: CircleInviteReminderCardProps) {
  const navigate = useNavigate()

  const is4h = subType === "CIRCLE_INVITE_4H_OWNER"

  const title = is4h
    ? `Still waiting on ${inviteeFirstName}?`
    : "Invite someone else?"

  const body = is4h
    ? "Resend or invite someone else to join your Circle."
    : `${inviteeFirstName} has not responded to your invite.`

  const timestamp = formatRelativeTime(sentAt)

  function handleNavigate() {
    navigate("/patients/network", { state: { invitationId } })
  }

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg overflow-hidden",
        readStatus === "UNREAD" && "bg-blue-50/30"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-[10px] py-[8px]">
        <div className="flex items-center justify-center size-[20px] shrink-0">
          <UserRoundPlus size={16} className="text-muted-foreground" />
        </div>
        <span className="flex-1 text-sm font-medium text-foreground">
          {title}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {timestamp}
        </span>
      </div>

      {/* Body text */}
      <div className="px-[10px] pb-[4px] pl-[36px]">
        <p className="text-sm font-normal text-muted-foreground">{body}</p>
      </div>

      {/* Action row */}
      <div
        className={cn(
          "flex items-center gap-[8px] pb-[16px] pl-[36px] pr-[8px] pt-[4px]"
        )}
      >
        {is4h ? (
          <>
            <Chip variant="ghost" onClick={handleNavigate}>
              View details
            </Chip>
            <div className="w-px h-[16px] bg-border" />
            <Chip onClick={handleNavigate}>
              Resend invite
              <ArrowRight size={12} />
            </Chip>
          </>
        ) : (
          <Chip onClick={handleNavigate}>
            Invite another person
            <ArrowRight size={12} />
          </Chip>
        )}
      </div>
    </div>
  )
}
