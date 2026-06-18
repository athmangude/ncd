import { Link, useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { useCircleStatus } from "../hooks/useCircleStatus"
import { CircleAvatarRow } from "./CircleAvatarRow"
import { CircleActivityBanner } from "./CircleActivityBanner"

export function CircleStatusSection() {
  const navigate = useNavigate()
  const status = useCircleStatus()
  const user = usePatientAuthStore((state: { user?: unknown }) => state.user) as
    | { firstName?: string; lastName?: string; profilePhoto?: string | null }
    | undefined

  if (!status.isLoading && !status.slots) {
    return null
  }

  const currentUser =
    user && (user.firstName || user.lastName)
      ? {
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          profilePhoto: user.profilePhoto ?? null,
        }
      : null

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">Your Circle</h2>
        <Link
          to="/patients/circle"
          className="text-sm font-medium text-purple-600"
        >
          See all
        </Link>
      </div>
      <CircleAvatarRow
        currentUser={currentUser}
        members={status.members}
        pendingInvites={status.pendingInvites}
        slots={status.slots}
        activeBanner={status.activeBanner}
        recentJoinedMemberId={status.recentJoinedMemberId}
        recentLeftMemberId={status.recentLeftMemberId}
        onAddMember={() => navigate("/patients/circle?add=1")}
        onMemberTap={(memberId) => navigate(`/patients/network/${memberId}`)}
        onInviteTap={(inviteId) => navigate(`/patients/network/${inviteId}`)}
      />
      {status.activeBanner && (
        <CircleActivityBanner banner={status.activeBanner} />
      )}
    </section>
  )
}
