import {
  CircleSlotAvatar,
  SLOT_RENDERED_SIZE,
  type CircleSlotVariant,
} from "@/components/CircleSlotAvatar"
import { Skeleton } from "@/components/Skeleton"
import type { NetworkMember, SentInvite } from "@/hooks/usePatientNetwork"

// ─── Layout constants ─────────────────────────────────────────────────────────

// All SVG coordinates are based on a 288 × 155 grid (matching Figma's 288px
// content width at 320px mobile with 16px side padding).
const SVG_WIDTH = 288
const SVG_HEIGHT = 155
const CENTER = { x: 144, y: 63 }
// Node pixel sizes come from SLOT_RENDERED_SIZE (avatar + halo) so positioning
// stays in sync with the rendered CircleSlotAvatar: center = lg, adults = md,
// children = sm.
const MAX_ADULTS = 4
const MAX_CHILDREN = 5
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

type NodePos = { svgX: number; svgY: number }

// Connecting-line styling per slot variant. Confirmed members ("active",
// "new") get a solid line whose colour matches their halo token; empty and
// pending slots keep a dashed line so unfilled/awaited connections read as
// provisional. Colours are bound via `currentColor` + a Tailwind text-* class
// matching the halo's bg-* token (see SLOT_CONFIG in CircleSlotAvatar).
const LINE_STYLE: Record<
  CircleSlotVariant,
  { colorClass: string; dashed: boolean }
> = {
  member: { colorClass: "text-neutral-200", dashed: false },
  active: { colorClass: "text-purple-300", dashed: false },
  new: { colorClass: "text-green-300", dashed: false },
  pending: { colorClass: "text-orange-300", dashed: true },
  defaulted: { colorClass: "text-red-300", dashed: false },
  inactive: { colorClass: "text-neutral-300", dashed: false },
  left: { colorClass: "text-neutral-300", dashed: false },
  empty: { colorClass: "text-[#efd0ff]", dashed: true },
}

// 4 adult slots: top-left, top-right, mid-left, mid-right
const ADULT_POSITIONS: NodePos[] = [
  { svgX: 68.44, svgY: 24.5 },
  { svgX: 219.56, svgY: 24.5 },
  { svgX: 68.44, svgY: 101.5 },
  { svgX: 219.56, svgY: 101.5 },
]

// 5 child slots: far-left, far-right, bottom-left, bottom-center, bottom-right
const CHILD_POSITIONS: NodePos[] = [
  { svgX: 16.94, svgY: 62.5 },
  { svgX: 271, svgY: 62.5 },
  { svgX: 102, svgY: 140 },
  { svgX: 143.94, svgY: 140 },
  { svgX: 185.87, svgY: 140 },
]

// Returns inline style positioning the top-left corner of a node given its
// SVG center coords. Left is a percentage so it scales with container width.
function nodeStyle(svgX: number, svgY: number, size: number) {
  return {
    left: `${((svgX - size / 2) / SVG_WIDTH) * 100}%`,
    top: svgY - size / 2,
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotNode = {
  id: string
  variant: CircleSlotVariant
  firstName?: string
  lastName?: string
  profilePhoto?: string | null
}

export type CircleNetworkVizProps = {
  currentUserFirstName: string
  currentUserLastName: string
  currentUserPhoto?: string | null
  adults: NetworkMember[]
  /** CHILD-relationship NetworkMembers — rendered as small peripheral nodes */
  childMembers: NetworkMember[]
  invites: SentInvite[]
  isLoading: boolean
  onAddMember: () => void
  onNodeClick?: (id: string) => void
}

// ─── Helper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function buildSlotNodes(
  adults: NetworkMember[],
  invites: SentInvite[]
): SlotNode[] {
  const nodes: SlotNode[] = []
  const now = Date.now()

  for (const member of adults) {
    if (nodes.length >= MAX_ADULTS) break
    const isNew = Boolean(
      member.joinedAt &&
        now - new Date(member.joinedAt).getTime() < SEVEN_DAYS_MS
    )
    nodes.push({
      id: member.id,
      variant: isNew ? "new" : "active",
      firstName: member.firstName,
      lastName: member.lastName,
      profilePhoto: member.profilePhoto,
    })
  }

  for (const invite of invites) {
    if (nodes.length >= MAX_ADULTS) break
    nodes.push({
      id: invite.id,
      variant: "pending",
      firstName: invite.firstName,
      lastName: invite.lastName,
      profilePhoto: invite.profilePhoto ?? null,
    })
  }

  while (nodes.length < MAX_ADULTS) {
    nodes.push({ id: `empty-${nodes.length}`, variant: "empty" })
  }

  return nodes
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CircleNetworkViz({
  currentUserFirstName,
  currentUserLastName,
  currentUserPhoto,
  adults,
  childMembers,
  invites,
  isLoading,
  onAddMember,
  onNodeClick,
}: CircleNetworkVizProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="relative h-[155px] w-full" aria-hidden="true">
        <Skeleton
          className="absolute rounded-full bg-muted"
          style={{
            width: SLOT_RENDERED_SIZE.lg,
            height: SLOT_RENDERED_SIZE.lg,
            left: "50%",
            top: CENTER.y - SLOT_RENDERED_SIZE.lg / 2,
            transform: "translateX(-50%)",
          }}
        />
        {ADULT_POSITIONS.map((pos, i) => (
          <Skeleton
            key={i}
            className="absolute rounded-full bg-muted"
            style={{
              width: SLOT_RENDERED_SIZE.md,
              height: SLOT_RENDERED_SIZE.md,
              ...nodeStyle(pos.svgX, pos.svgY, SLOT_RENDERED_SIZE.md),
            }}
          />
        ))}
      </div>
    )
  }

  const slotNodes = buildSlotNodes(adults, invites)
  const visibleChildren = childMembers.slice(0, MAX_CHILDREN)

  return (
    <div className="relative h-[155px] w-full overflow-visible">
      {/* Dashed connecting lines — preserveAspectRatio none so SVG coords
          scale linearly with container width, matching the % CSS positions */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {slotNodes.map((node, i) => {
          const { colorClass, dashed } = LINE_STYLE[node.variant]
          return (
            <line
              key={`al-${i}`}
              className={colorClass}
              x1={CENTER.x}
              y1={CENTER.y}
              x2={ADULT_POSITIONS[i].svgX}
              y2={ADULT_POSITIONS[i].svgY}
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={dashed ? "4 4" : undefined}
            />
          )
        })}
        {/* Children are always confirmed members — solid line matching the
            "member" variant's neutral halo. */}
        {visibleChildren.map((_, i) => (
          <line
            key={`cl-${i}`}
            className={LINE_STYLE.member.colorClass}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={CHILD_POSITIONS[i].svgX}
            y2={CHILD_POSITIONS[i].svgY}
            stroke="currentColor"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Centre: current user — rendered as a confirmed (active) slot. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: SLOT_RENDERED_SIZE.lg,
          height: SLOT_RENDERED_SIZE.lg,
          left: "50%",
          top: CENTER.y - SLOT_RENDERED_SIZE.lg / 2,
          transform: "translateX(-50%)",
        }}
      >
        <CircleSlotAvatar
          variant="active"
          size="lg"
          firstName={currentUserFirstName}
          lastName={currentUserLastName}
          profilePhoto={currentUserPhoto}
        />
      </div>

      {/* Adult slots */}
      {slotNodes.map((node, i) => (
        <div
          key={node.id}
          className="absolute flex flex-col items-center"
          style={nodeStyle(
            ADULT_POSITIONS[i].svgX,
            ADULT_POSITIONS[i].svgY,
            SLOT_RENDERED_SIZE.md
          )}
        >
          <CircleSlotAvatar
            variant={node.variant}
            firstName={node.firstName}
            lastName={node.lastName}
            profilePhoto={node.profilePhoto}
            showBadge
            onClick={
              node.variant === "empty"
                ? onAddMember
                : onNodeClick
                  ? () => onNodeClick(node.id)
                  : undefined
            }
          />
        </div>
      ))}

      {/* Child nodes — confirmed members rendered as small (sm) slots. */}
      <div data-testid="child-nodes">
        {visibleChildren.map((child, i) => (
          <div
            key={child.id}
            className="absolute flex items-center justify-center"
            style={nodeStyle(
              CHILD_POSITIONS[i].svgX,
              CHILD_POSITIONS[i].svgY,
              SLOT_RENDERED_SIZE.sm
            )}
          >
            <CircleSlotAvatar
              variant="member"
              size="sm"
              firstName={child.firstName}
              lastName={child.lastName}
              profilePhoto={child.profilePhoto}
              onClick={onNodeClick ? () => onNodeClick(child.id) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
