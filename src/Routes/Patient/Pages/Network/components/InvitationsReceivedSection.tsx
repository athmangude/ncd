import { useNavigate } from "react-router-dom"
import { SectionTitle } from "@/components/SectionTitle"
import { InviteRequestCard } from "./InviteRequestCard"

interface InvitationsReceivedSectionProps {
  receivedInvites: any[]
}

export function InvitationsReceivedSection({
  receivedInvites,
}: InvitationsReceivedSectionProps) {
  const navigate = useNavigate()

  if (receivedInvites.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <SectionTitle level={3}>
          Invite Requests ({receivedInvites.length})
        </SectionTitle>
        <span
          className="text-purple-600 font-medium text-sm cursor-pointer"
          onClick={() => navigate("/patients/network/invitations-received")}
        >
          View All
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
        {receivedInvites.map((invite: any) => (
          <InviteRequestCard key={invite.id} {...invite} />
        ))}
      </div>
    </div>
  )
}
