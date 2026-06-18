import { CircleSlotAvatar, type CircleSlotVariant } from "@/components/CircleSlotAvatar"

export type LinkedAvatarVariant =
  | "new"
  | "active"
  | "defaulted"
  | "pending"
  | "rejected"

interface AvatarInfo {
  firstName: string
  lastName: string
  profilePhoto: string | null
}

interface LinkedAvatarPairProps {
  you: AvatarInfo
  them: AvatarInfo
  variant: LinkedAvatarVariant
}

const VARIANT_TO_SLOT: Record<LinkedAvatarVariant, CircleSlotVariant> = {
  new: "new",
  active: "active",
  defaulted: "defaulted",
  pending: "pending",
  rejected: "left",
}

export function LinkedAvatarPair({ you, them, variant }: LinkedAvatarPairProps) {
  const slotVariant = VARIANT_TO_SLOT[variant]
  const label = `You and ${them.firstName} are connected`

  return (
    <div
      aria-label={label}
      className="flex items-center justify-center py-4">
      <CircleSlotAvatar
        firstName={you.firstName}
        lastName={you.lastName}
        profilePhoto={you.profilePhoto}
        variant="active"
        size="lg"
      />
      <div className="h-1 w-6 bg-purple-300" aria-hidden />
      <CircleSlotAvatar
        firstName={them.firstName}
        lastName={them.lastName}
        profilePhoto={them.profilePhoto}
        variant={slotVariant}
        size="lg"
        showBadge
      />
    </div>
  )
}
