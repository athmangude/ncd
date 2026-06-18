import {
  CircleSlotAvatar,
  type CircleSlotVariant,
} from "@/components/CircleSlotAvatar"
import { variantFromStatus } from "@/components/CircleMemberCard"
import { cn } from "@/lib/utils"
import type {
  NetworkMember,
  SentInvite,
} from "@/hooks/usePatientNetwork"
import type { BannerState } from "../hooks/useCircleStatus"
import type { ReactNode } from "react"

interface SlotStats {
  used: number
  reserved: number
  max: number
}

export interface CurrentUserAvatar {
  firstName: string
  lastName: string
  profilePhoto?: string | null
}

export interface CircleAvatarRowProps {
  currentUser?: CurrentUserAvatar | null
  members: NetworkMember[]
  pendingInvites: SentInvite[]
  slots?: {
    accountable: SlotStats
    auxiliary: SlotStats
  }
  activeBanner: BannerState | null
  recentJoinedMemberId: string | null
  recentLeftMemberId: string | null
  onAddMember: () => void
  onMemberTap?: (memberId: string) => void
  onInviteTap?: (inviteId: string) => void
}

function StackedCell({
  index,
  total,
  children,
}: {
  index: number
  total: number
  children: ReactNode
}) {
  // Layer each cell on top of the previous one. Higher z-index for earlier
  // cells keeps the leftmost avatar (the current user) on top of the stack.
  return (
    <div
      data-testid="stacked-cell"
      className={cn("relative shrink-0", index > 0 && "-ml-3")}
      style={{ zIndex: total - index }}
    >
      {children}
    </div>
  )
}

function isChildRelationship(relationship?: string | null): boolean {
  return typeof relationship === "string" && relationship.toUpperCase() === "CHILD"
}

export function CircleAvatarRow({
  currentUser,
  members,
  pendingInvites,
  slots,
  activeBanner,
  recentJoinedMemberId,
  recentLeftMemberId,
  onAddMember,
  onMemberTap,
  onInviteTap,
}: CircleAvatarRowProps) {
  const accountableMax = slots?.accountable.max ?? 3
  const auxiliaryMax = slots?.auxiliary.max ?? 2

  const memberVariant = (m: NetworkMember): CircleSlotVariant => {
    if (activeBanner?.variant === "MEMBER_LEFT" && m.id === recentLeftMemberId) {
      return "left"
    }
    if (
      activeBanner?.variant === "MEMBER_JOINED" &&
      m.id === recentJoinedMemberId
    ) {
      return "new"
    }
    return variantFromStatus(m.status, {
      joinedAt: m.joinedAt,
      hasDefaultedLoan: m.hasDefaultedLoan,
    })
  }

  const renderMember = (m: NetworkMember): ReactNode => (
    <CircleSlotAvatar
      key={`m-${m.id}`}
      firstName={m.firstName}
      lastName={m.lastName}
      profilePhoto={m.profilePhoto ?? null}
      variant={memberVariant(m)}
      onClick={onMemberTap ? () => onMemberTap(m.id) : undefined}
    />
  )

  const renderInvite = (i: SentInvite): ReactNode => (
    <CircleSlotAvatar
      key={`i-${i.id}`}
      firstName={i.firstName ?? ""}
      lastName={i.lastName ?? ""}
      profilePhoto={i.profilePhoto ?? null}
      variant="pending"
      onClick={onInviteTap ? () => onInviteTap(i.id) : undefined}
    />
  )

  const adultMembers = members.filter((m) => !isChildRelationship(m.relationship))
  const childMembers = members.filter((m) => isChildRelationship(m.relationship))
  const adultInvites = pendingInvites.filter(
    (i) => !isChildRelationship(i.relationship),
  )
  const childInvites = pendingInvites.filter((i) =>
    isChildRelationship(i.relationship),
  )

  const stackedCells: ReactNode[] = [
    ...adultMembers.map(renderMember),
    ...adultInvites.map(renderInvite),
    ...childMembers.map(renderMember),
    ...childInvites.map(renderInvite),
  ]

  const adultFilled = adultMembers.length + adultInvites.length
  const emptyAccountableCount = Math.max(0, accountableMax - adultFilled)
  for (let i = 0; i < emptyAccountableCount; i++) {
    stackedCells.push(
      <CircleSlotAvatar key={`e-${i}`} variant="empty" onClick={onAddMember} />,
    )
  }

  if (adultFilled > 0) {
    const auxiliaryUsed =
      (slots?.auxiliary.used ?? 0) + (slots?.auxiliary.reserved ?? 0)
    const auxiliaryUnfilled = Math.max(0, auxiliaryMax - auxiliaryUsed)
    for (let i = 0; i < auxiliaryUnfilled; i++) {
      stackedCells.push(<CircleSlotAvatar key={`l-${i}`} variant="inactive" />)
    }
  }

  return (
    <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pt-2">
      {currentUser && (
        <div data-testid="current-user-avatar" className="shrink-0">
          <CircleSlotAvatar
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
            profilePhoto={currentUser.profilePhoto ?? null}
            variant="active"
          />
        </div>
      )}
      <div data-testid="stacked-group" className="flex items-start">
        {stackedCells.map((cell, idx) => (
          <StackedCell key={idx} index={idx} total={stackedCells.length}>
            {cell}
          </StackedCell>
        ))}
      </div>
    </div>
  )
}
