import type { SentInvite } from "@/hooks/usePatientNetwork"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import { SendReminderCard } from "../SendReminderCard"
import { CallDirectlyCard } from "../CallDirectlyCard"
import { RemoveMemberButton } from "../RemoveMemberButton"

interface PendingInviteBodyProps {
  invite: SentInvite
  you: { firstName: string; lastName: string; profilePhoto: string | null }
}

export function PendingInviteBody({ invite }: PendingInviteBodyProps) {
  const name =
    `${invite.firstName ?? ""} ${invite.lastName ?? ""}`.trim() || "Pending"
  return (
    <div className="flex flex-col gap-4">
      {/* Invitee avatar with waiting indicator */}
      <div className="flex flex-col items-center pt-2">
        <div className="relative mb-4">
          <div className="relative h-[84px] w-[84px]">
            <div className="h-full w-full overflow-hidden rounded-full border-[3.5px] border-orange-200 shadow-md">
              <ProfileAvatar
                src={invite.profilePhoto ?? null}
                name={name}
                firstName={invite.firstName ?? ""}
                lastName={invite.lastName ?? ""}
                className="h-full w-full"
              />
            </div>
            <span className="absolute right-0 top-0 h-[17px] w-[17px] rounded-full bg-orange-400 ring-2 ring-white" />
          </div>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            Waiting...
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="text-center text-xl font-medium tracking-tight text-foreground">
        Your invite is still pending
      </p>

      {/* Member info row */}
      <div className="flex items-center gap-2 rounded-md bg-card px-3 py-2">
        <ProfileAvatar
          src={invite.profilePhoto ?? null}
          name={name}
          firstName={invite.firstName ?? ""}
          lastName={invite.lastName ?? ""}
          className="h-10 w-10 shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm text-foreground">{name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {invite.phoneNumber}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
          Waiting...
        </span>
      </div>

      <SendReminderCard inviteId={invite.id} />
      <CallDirectlyCard phoneNumber={invite.phoneNumber ?? null} />
      <RemoveMemberButton kind="invite" targetId={invite.id} name={name} />
    </div>
  )
}
