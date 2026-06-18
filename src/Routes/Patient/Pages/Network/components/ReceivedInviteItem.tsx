import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import { ProfileAvatar } from "@/components/ProfileAvatar"

export function ReceivedInviteItem({
  id,
  inviterFirstName,
  inviterLastName,
  phoneNumber,
  profilePhoto
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
      <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-neutral-100">
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
                <span className="font-medium truncate text-neutral-900">{inviterFirstName} {inviterLastName}</span>
            </div>
            <span className="text-neutral-400 text-sm truncate">{phoneNumber}</span>
        </div>

        <Button 
            size="sm" 
            className="bg-purple-100  text-purple-700 hover:bg-purple-200  "
            onClick={() => navigate(`/patients/network/accept-invite?inviteId=${id}`)}
        >
            Review 
        </Button>

      </div>
  )
}

