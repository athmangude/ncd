import { useNavigate } from "react-router-dom"
import { SentInviteCard } from "./SentInviteCard"

interface Invite {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  profilePhoto?: string | null
}

interface InvitationsSentSectionProps {
  invites: Invite[]
}

export function InvitationsSentSection({
  invites,
}: InvitationsSentSectionProps) {
  const navigate = useNavigate()

  if (invites.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-muted-foreground">
          Sent Invites ({invites.length})
        </h3>
        <span
          className="text-purple-600 font-medium text-sm cursor-pointer"
          onClick={() => navigate("/patients/network/invitations-sent")}
        >
          View All
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
        {invites.map((invite) => (
          <SentInviteCard
            key={invite.id}
            id={invite.id}
            firstName={invite.firstName}
            lastName={invite.lastName}
            phoneNumber={invite.phoneNumber}
            profilePhoto={invite.profilePhoto}
          />
        ))}
      </div>
    </div>
  )
}
