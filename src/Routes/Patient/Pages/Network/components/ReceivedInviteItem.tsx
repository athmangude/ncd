import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import { ProfileAvatar } from "@/components/ProfileAvatar"

export function ReceivedInviteItem({
  id,
  inviterFirstName,
  inviterLastName,
  phoneNumber,
  profilePhoto,
}: {
  id: string
  inviterFirstName: string
  inviterLastName: string
  phoneNumber: string
  status: string
  profilePhoto?: string | null
}) {
  const navigate = useNavigate()

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-border">
      <ProfileAvatar
        src={profilePhoto}
        name={`${inviterFirstName} ${inviterLastName}`}
        firstName={inviterFirstName}
        lastName={inviterLastName}
        className="h-10 w-10"
        fallbackClassName="text-sm"
      />

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate text-foreground">
            {inviterFirstName} {inviterLastName}
          </span>
        </div>
        <span className="text-muted-foreground text-sm truncate">
          {phoneNumber}
        </span>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          navigate(`/patients/network/accept-invite?inviteId=${id}`)
        }
      >
        Review
      </Button>
    </div>
  )
}
