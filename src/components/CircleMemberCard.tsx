import { cn } from "@/lib/utils"
import { CircleSlotAvatar } from "@/components/CircleSlotAvatar"

export type CircleMemberVariant =
  | "active"
  | "new"
  | "pending"
  | "defaulted"
  | "inactive"

export type CircleMemberLayout = "list" | "card"

export interface CircleMemberCardProps {
  firstName: string
  lastName: string
  phoneNumber?: string
  profilePhoto?: string | null
  variant: CircleMemberVariant
  relationship?: string
  className?: string
  layout?: CircleMemberLayout
  children?: React.ReactNode
}

export function CircleMemberCard({
  firstName,
  lastName,
  phoneNumber,
  profilePhoto,
  variant,
  relationship,
  className,
  layout = "list",
  children,
}: CircleMemberCardProps) {
  const name = `${firstName} ${lastName}`

  if (layout === "card") {
    return (
      <div
        className={cn(
          "bg-white p-4 rounded-xl shadow-sm border border-neutral-100",
          "min-w-[240px] w-[240px] shrink-0 snap-center flex flex-col items-center gap-2",
          className
        )}
      >
        <CircleSlotAvatar
          firstName={firstName}
          lastName={lastName}
          profilePhoto={profilePhoto}
          variant={variant}
          showBadge
        />
        <div className="text-center overflow-hidden w-full">
          <p className="font-medium text-neutral-900 truncate text-sm">{name}</p>
          {phoneNumber && (
            <p className="text-neutral-500 text-xs truncate">{phoneNumber}</p>
          )}
          {relationship && (
            <p className="text-neutral-400 text-xs capitalize truncate">
              {relationship.toLowerCase()}
            </p>
          )}
        </div>
        {children && <div className="flex gap-2 w-full">{children}</div>}
      </div>
    )
  }

  // list layout — avatar (with overlaid status badge) on the left, name+meta on the right
  return (
    <div
      className={cn(
        "bg-white p-3 rounded-xl shadow-sm flex items-center gap-3",
        "border border-neutral-100",
        className,
      )}
    >
      <CircleSlotAvatar
        firstName={firstName}
        lastName={lastName}
        profilePhoto={profilePhoto}
        variant={variant}
        showBadge
      />

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="font-medium truncate text-neutral-900 text-sm">
          {name}
        </span>
        {phoneNumber && (
          <span className="text-neutral-400 text-sm truncate">{phoneNumber}</span>
        )}
        {relationship && (
          <span className="text-neutral-400 text-xs capitalize">
            {relationship.toLowerCase()}
          </span>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {children}
        </div>
      )}
    </div>
  )
}

function isWithin7Days(timestamp?: string | Date | null): boolean {
  if (!timestamp) return false
  const joined = typeof timestamp === "string" ? new Date(timestamp) : timestamp
  if (Number.isNaN(joined.getTime())) return false
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return Date.now() - joined.getTime() < sevenDaysMs
}

// eslint-disable-next-line react-refresh/only-export-components
export function variantFromStatus(
  status: string,
  opts: {
    joinedAt?: string | Date | null
    hasDefaultedLoan?: boolean
  } = {}
): CircleMemberVariant {
  if (opts.hasDefaultedLoan) return "defaulted"

  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "ACCEPTED":
    case "DEPENDENT":
      return isWithin7Days(opts.joinedAt) ? "new" : "active"
    case "PENDING":
    case "OPENED":
      return "pending"
    case "STALLED":
    case "REJECTED":
    case "CANCELLED":
    case "INACTIVE":
    case "REVOKED":
      return "inactive"
    default:
      return "active"
  }
}
