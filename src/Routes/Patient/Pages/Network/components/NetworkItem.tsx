import { Link } from "react-router-dom"
import { CircleMemberCard, variantFromStatus } from "@/components/CircleMemberCard"

interface NetworkItemProps {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  status: string
  type?: string
  profilePhoto?: string | null
  joinedAt?: string | null
  hasDefaultedLoan?: boolean
}

export function NetworkItem({
  id,
  firstName,
  lastName,
  phoneNumber,
  status,
  profilePhoto,
  joinedAt,
  hasDefaultedLoan,
}: NetworkItemProps) {
  const variant = variantFromStatus(status, { joinedAt, hasDefaultedLoan })
  return (
    <Link to={`/patients/network/${id}`} className="block no-underline">
      <CircleMemberCard
        firstName={firstName}
        lastName={lastName}
        phoneNumber={phoneNumber ?? undefined}
        profilePhoto={profilePhoto}
        variant={variant}
        layout="list"
      />
    </Link>
  )
}
