import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/Button"
import { usePatientNetwork, type SentInvite } from "@/hooks/usePatientNetwork"
import { CircleAvatarRow } from "../../Dashboard/components/CircleAvatarRow"
import type { BannerState } from "../../Dashboard/hooks/useCircleStatus"
import type { ExtendedUser } from "./types"

interface CircleWaitingDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: ExtendedUser | null
}

function CreditScoreGauge() {
  const r = 16
  const cx = 24
  const cy = 26
  const circumference = 2 * Math.PI * r
  const trackLength = (270 / 360) * circumference
  const trackGap = circumference - trackLength
  const fillLength = 0.38 * trackLength

  // needle sits at 37% through the 270° arc; arc starts at 135° (SW) in SVG
  const needleDeg = 135 + 0.37 * 270
  const needleRad = (needleDeg * Math.PI) / 180
  const nl = 10
  const nx = (cx + nl * Math.cos(needleRad)).toFixed(2)
  const ny = (cy + nl * Math.sin(needleRad)).toFixed(2)

  return (
    <svg
      viewBox="0 0 48 48"
      className="w-12 h-12"
      fill="none"
      aria-hidden="true"
    >
      {/* background track – 270° arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="#efd0ff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${trackLength.toFixed(2)} ${trackGap.toFixed(2)}`}
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* filled portion */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${fillLength.toFixed(2)} ${(circumference - fillLength).toFixed(2)}`}
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#3D3D3D"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="2" fill="hsl(var(--primary))" />
    </svg>
  )
}

export function CircleWaitingDrawer({
  isOpen,
  onClose,
  user,
}: CircleWaitingDrawerProps) {
  const navigate = useNavigate()
  const { data: networkData } = usePatientNetwork()

  if (!isOpen) return null

  const filledSlots = user?.patientCircle?.filledAccountableSlots ?? 0

  const adultPendingInvites: SentInvite[] = (networkData?.invites ?? []).filter(
    (inv) =>
      inv.relationship?.toUpperCase() !== "CHILD" &&
      ["PENDING", "OPENED"].includes(inv.status?.toUpperCase() ?? "")
  )

  const nameParts = (user?.name ?? "").trim().split(" ")
  const userFirstName = nameParts[0] ?? ""
  const userLastName = nameParts.slice(1).join(" ")

  const currentUser =
    userFirstName || userLastName
      ? { firstName: userFirstName, lastName: userLastName, profilePhoto: null }
      : null

  // Force pending styling on invite avatars so they render with the orange halo
  const activeBanner: BannerState | null =
    adultPendingInvites.length > 0
      ? { variant: "PENDING_INVITES", count: adultPendingInvites.length }
      : null

  // 2 accountable (bronze) slots + 7 locked (1 silver + 2 gold + 4 platinum)
  const slots = {
    accountable: { used: 0, reserved: 0, max: 2 },
    auxiliary: { used: 0, reserved: 0, max: 7 },
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto">
      <div className="flex flex-col flex-1 w-full max-w-lg mx-auto">
        {/* back button */}
        <div className="px-4 pt-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </Button>
        </div>

        {/* header */}
        <div className="flex flex-col items-center gap-2 px-4 pt-6 pb-4 text-center shrink-0">
          <CreditScoreGauge />
          <h1 className="text-foreground leading-[1.25] tracking-[-0.4px]">
            Waiting on your Circle members
          </h1>
          <p className="text-sm text-muted-foreground leading-5">
            Your invites were sent. Once they confirm, you can pay the KES 499
            and start borrowing.
          </p>
        </div>

        {/* avatar row */}
        <div className="px-4 py-4 shrink-0">
          <CircleAvatarRow
            currentUser={currentUser}
            members={[]}
            pendingInvites={adultPendingInvites}
            slots={slots}
            activeBanner={activeBanner}
            recentJoinedMemberId={null}
            recentLeftMemberId={null}
            onAddMember={() => navigate("/patients/network/invitations-sent")}
          />
          {adultPendingInvites.length > 0 && (
            <div className="mt-2 ml-1">
              <span className="bg-orange-100 text-orange-700 text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                Waiting...
              </span>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="mt-auto px-4 pb-10 pt-2 shrink-0">
          <div className="flex flex-col gap-3 items-center">
            <Button
              className="w-full"
              onClick={() => {
                onClose()
                navigate("/patients/network/invitations-sent")
              }}
            >
              Check invite status
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Members must accept before your Circle qualifies.
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-muted">
              <span className="text-xs font-medium text-foreground">
                {filledSlots} member{filledSlots !== 1 ? "s" : ""} pending
                confirmation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
