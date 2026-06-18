import { Link } from "react-router-dom"
import { CircleMemberCard } from "@/components/CircleMemberCard"

interface SentInviteCardProps {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  profilePhoto?: string | null
}

export function SentInviteCard({
  id,
  firstName,
  lastName,
  phoneNumber,
  profilePhoto,
}: SentInviteCardProps) {
  return (
    <Link to={`/patients/network/${id}`} className="block no-underline">
      <CircleMemberCard
        firstName={firstName}
        lastName={lastName}
        phoneNumber={phoneNumber}
        profilePhoto={profilePhoto}
        variant="pending"
        layout="card"
      />
    </Link>
  )
}
