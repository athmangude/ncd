import { useNavigate } from "react-router-dom"
import { UserRoundPlus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

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
        "bg-white border border-neutral-200 rounded-lg overflow-hidden",
        readStatus === "UNREAD" && "bg-blue-50/30",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-[10px] py-[8px]">
        <div className="flex items-center justify-center size-[20px] shrink-0">
          <UserRoundPlus
            size={16}
            className="text-neutral-600"
          />
        </div>
        <span className="flex-1 text-sm font-medium text-neutral-900">
          {title}
        </span>
        <span className="text-xs text-neutral-600 shrink-0">{timestamp}</span>
      </div>

      {/* Body text */}
      <div className="px-[10px] pb-[4px] pl-[36px]">
        <p className="text-sm font-normal text-neutral-500">{body}</p>
      </div>

      {/* Action row */}
      <div
        className={cn(
          "flex items-center gap-[8px] pb-[16px] pl-[36px] pr-[8px] pt-[4px]",
        )}
      >
        {is4h ? (
          <>
            <button
              type="button"
              className="h-[24px] px-[8px] bg-transparent text-sm font-medium text-neutral-800 rounded"
              onClick={handleNavigate}
            >
              View details
            </button>
            <div className="w-px h-[16px] bg-neutral-200" />
            <button
              type="button"
              className="flex items-center gap-[6px] h-[24px] px-[8px] rounded-[4px] text-sm font-medium"
              style={{ backgroundColor: "#f5e5ff", color: "#8112b7" }}
              onClick={handleNavigate}
            >
              Resend invite
              <ArrowRight size={12} />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="flex items-center gap-[6px] h-[24px] px-[8px] rounded-[4px] text-sm font-medium"
            style={{ backgroundColor: "#f5e5ff", color: "#8112b7" }}
            onClick={handleNavigate}
          >
            Invite another person
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
