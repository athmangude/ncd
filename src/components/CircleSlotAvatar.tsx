import { Lock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileAvatar } from "@/components/ProfileAvatar"

export type CircleSlotVariant =
  | "member"
  | "active"
  | "new"
  | "pending"
  | "defaulted"
  | "inactive"
  | "left"
  | "empty"

export type CircleSlotSize = "sm" | "md" | "lg"

// Full rendered pixel size of a slot per token: the avatar (h-6 / h-12 /
// h-20 → 24 / 48 / 80) plus the halo's `p-1` padding (4px each side = +8px).
// Consumers that position a slot by its centre (e.g. CircleNetworkViz
// connecting lines) must size their wrapper to this, not to the avatar alone,
// or the centre will be off. Keep in sync with SIZE_CONFIG below.
export const SLOT_RENDERED_SIZE = { sm: 32, md: 56, lg: 88 } as const

type SizeConfig = {
  avatarClass: string
  lockBoxClass: string
  lockIconClass: string
  dotClass: string
  plusClass: string
  emptyBoxClass: string
  badgeTextClass: string
  fallbackClass: string
}

// sm = 24px (junior members), md = 48px (default — adults / dashboard),
// lg = 80px (current user / member-details). Every dependent element scales
// in concert so the dot, lock, plus icon, and badge stay proportional.
const SIZE_CONFIG: Record<CircleSlotSize, SizeConfig> = {
  sm: {
    avatarClass: "h-6 w-6",
    lockBoxClass: "h-5 w-5",
    lockIconClass: "h-3 w-3",
    dotClass: "h-2 w-2",
    plusClass: "h-3 w-3",
    emptyBoxClass: "h-6 w-6",
    badgeTextClass: "text-[8px]",
    fallbackClass: "text-[10px]",
  },
  md: {
    avatarClass: "h-12 w-12",
    lockBoxClass: "h-10 w-10",
    lockIconClass: "h-5 w-5",
    dotClass: "h-3 w-3",
    plusClass: "h-5 w-5",
    emptyBoxClass: "h-12 w-12",
    badgeTextClass: "text-[10px]",
    fallbackClass: "text-sm",
  },
  lg: {
    avatarClass: "h-20 w-20",
    lockBoxClass: "h-16 w-16",
    lockIconClass: "h-8 w-8",
    dotClass: "h-4 w-4",
    plusClass: "h-8 w-8",
    emptyBoxClass: "h-20 w-20",
    badgeTextClass: "text-xs",
    fallbackClass: "text-lg",
  },
}

type SlotBadge = {
  label: string
  className: string
}

type SlotConfig = {
  haloClass: string
  dotClass: string | null
  showLock: boolean
  isEmpty: boolean
  avatarOpacity?: string
  badge?: SlotBadge
}

const SLOT_CONFIG: Record<CircleSlotVariant, SlotConfig> = {
  // Plain confirmed member: neutral halo, no status dot, lock, or dimming.
  member: {
    haloClass: "bg-muted",
    dotClass: null,
    showLock: false,
    isEmpty: false,
  },
  active: {
    haloClass: "bg-secondary",
    dotClass: null,
    showLock: false,
    isEmpty: false,
  },
  new: {
    haloClass: "bg-success",
    dotClass: "bg-success-solid",
    showLock: false,
    isEmpty: false,
    badge: { label: "New!", className: "bg-success text-success-foreground" },
  },
  pending: {
    haloClass: "bg-warning",
    dotClass: "bg-warning-solid",
    showLock: false,
    isEmpty: false,
    badge: {
      label: "Waiting...",
      className: "bg-warning text-warning-foreground",
    },
  },
  defaulted: {
    haloClass: "bg-destructive",
    dotClass: "bg-destructive",
    showLock: false,
    isEmpty: false,
    badge: {
      label: "Default",
      className: "bg-destructive text-destructive-foreground",
    },
  },
  inactive: {
    haloClass: "bg-border",
    dotClass: null,
    showLock: true,
    isEmpty: false,
  },
  left: {
    haloClass: "bg-border",
    dotClass: null,
    showLock: false,
    isEmpty: false,
    avatarOpacity: "opacity-40",
  },
  empty: {
    haloClass: "",
    dotClass: null,
    showLock: false,
    isEmpty: true,
  },
}

export interface CircleSlotAvatarProps {
  firstName?: string
  lastName?: string
  profilePhoto?: string | null
  variant: CircleSlotVariant
  onClick?: () => void
  className?: string
  /** Render the variant's status badge (e.g. "New!", "Waiting...") below the avatar. */
  showBadge?: boolean
  /** Avatar size token. sm=24px, md=48px (default), lg=80px. */
  size?: CircleSlotSize
}

export function CircleSlotAvatar({
  firstName = "",
  lastName = "",
  profilePhoto = null,
  variant,
  onClick,
  className,
  showBadge = false,
  size = "md",
}: CircleSlotAvatarProps) {
  const { haloClass, dotClass, showLock, isEmpty, avatarOpacity, badge } =
    SLOT_CONFIG[variant]
  const sizes = SIZE_CONFIG[size]

  if (isEmpty) {
    return (
      <button
        type="button"
        data-testid="empty-slot"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "shrink-0 rounded-full border-2 border-dashed bg-muted",
          sizes.emptyBoxClass,
          "border-border flex items-center justify-center text-muted-foreground",
          onClick && "hover:border-secondary hover:text-primary",
          className
        )}
        aria-label="Add member"
      >
        <Plus className={sizes.plusClass} />
      </button>
    )
  }

  const halo = (
    <div
      data-testid="avatar-halo"
      className={cn(
        "relative shrink-0 rounded-full p-1",
        haloClass,
        avatarOpacity,
        className
      )}
    >
      {showLock ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted",
            sizes.lockBoxClass
          )}
        >
          <Lock
            data-testid="lock-icon"
            className={cn(sizes.lockIconClass, "text-muted-foreground")}
          />
        </div>
      ) : (
        <ProfileAvatar
          src={profilePhoto}
          name={`${firstName} ${lastName}`.trim() || "?"}
          firstName={firstName}
          lastName={lastName}
          className={sizes.avatarClass}
          fallbackClassName={sizes.fallbackClass}
        />
      )}
      {dotClass && (
        <span
          data-testid="avatar-dot"
          className={cn(
            "absolute -top-0.5 -right-0.5 rounded-full",
            sizes.dotClass,
            "border-2 border-white",
            dotClass
          )}
        />
      )}
    </div>
  )

  const content =
    showBadge && badge ? (
      <div className="relative shrink-0">
        {halo}
        <span
          data-testid="avatar-badge"
          className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap",
            "rounded-full px-2 py-0.5 font-medium",
            sizes.badgeTextClass,
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>
    ) : (
      halo
    )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-full"
        aria-label={`${firstName} ${lastName}`.trim() || "Circle member"}
      >
        {content}
      </button>
    )
  }

  return content
}
