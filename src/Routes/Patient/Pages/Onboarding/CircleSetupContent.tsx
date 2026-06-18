import { useEffect, useMemo } from "react"
import { Info, ChevronRight, UserRoundPlus } from "lucide-react"
import { useNetworkData } from "@/Routes/Patient/Pages/Network/hooks/useNetworkData"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { trackEvent, EVENTS } from "@/analytics"
import { Button } from "@/components/Button"
import ErrorBlock from "@/components/ErrorBlock"
import circleEmptyState from "@/assets/images/circle-empty-state.png"
import { CircleNetworkViz } from "./CircleNetworkViz"

type PatientUser = {
  firstName: string
  lastName: string
  profilePhoto?: string | null
} | null

export type CircleSetupContentProps = {
  /** Opens the add-member / invite flow. */
  onAddMember: () => void
  /** Tapping a member node — navigates to that member's details. */
  onNodeClick?: (id: string) => void
  /** Opens the "What is a Circle?" educational screen. */
  onLearnMore: () => void
}

/**
 * Shell-agnostic Circle content: the "My Jireh Circle" heading, the
 * "What is a Circle?" link, and either the empty-state placeholder (when the
 * user has no members and no pending/received invites) or the
 * {@link CircleNetworkViz}. Navigation is injected so the same content renders
 * inside the dashboard Circle tab and on the standalone setup-intro page.
 */
export function CircleSetupContent({
  onAddMember,
  onNodeClick,
  onLearnMore,
}: CircleSetupContentProps) {
  const { data, isLoading, isError, error } = useNetworkData()
  const user = usePatientAuthStore((s: { user: PatientUser }) => s.user)

  // Empty = no members AND no invites sent AND no invites received. Once the
  // user invites or has been invited, we show the visualization.
  const isEmpty =
    !isLoading &&
    (data?.network.length ?? 0) === 0 &&
    (data?.invites.length ?? 0) === 0 &&
    (data?.receivedInvites.length ?? 0) === 0

  const ctaLabel = isEmpty ? "Start building your Circle" : "Add new member"

  useEffect(() => {
    if (isEmpty) {
      try {
        trackEvent(EVENTS.CIRCLE.EMPTY_STATE_VIEW)
      } catch {
        // Silent fail — analytics must never break the view.
      }
    }
  }, [isEmpty])

  const handleAddMember = () => {
    try {
      trackEvent(EVENTS.CIRCLE.START_BUILDING_TAP, { firstInvite: isEmpty })
    } catch {
      // Silent fail.
    }
    onAddMember()
  }

  const subtitle = useMemo(
    () => (
      <p className="text-sm text-neutral-500 text-center">
        Add people you trust. Share cashback.
        <br />
        Help each other when it matters.
      </p>
    ),
    []
  )

  if (isError) {
    const isOffline = !navigator.onLine
    return (
      <ErrorBlock
        message={
          isOffline
            ? "You are offline and no cached data is available. Please connect to the internet to load your Circle."
            : (error as { response?: { data?: { message?: string } }; message?: string })
                ?.response?.data?.message ||
              (error as { message?: string })?.message
        }
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-medium text-2xl text-center">
          {isEmpty ? (
            <>
              Build a group that
              <br />
              looks after each other
            </>
          ) : (
            "My Jireh Circle"
          )}
        </h1>
        {subtitle}
      </div>

      <button
        type="button"
        onClick={onLearnMore}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#edf7f7] text-[#171717] text-sm"
      >
        <Info className="w-4 h-4 text-[#525252] flex-shrink-0" />
        <span>What is a Circle?</span>
        <ChevronRight className="w-4 h-4 text-[#525252]" />
      </button>

      {isEmpty ? (
        <img
          src={circleEmptyState}
          alt="A circle of people connected together"
          className="w-full max-w-xs"
        />
      ) : (
        <CircleNetworkViz
          currentUserFirstName={user?.firstName ?? ""}
          currentUserLastName={user?.lastName ?? ""}
          currentUserPhoto={user?.profilePhoto}
          adults={data?.adults ?? []}
          childMembers={data?.children ?? []}
          invites={data?.invites ?? []}
          isLoading={isLoading}
          onAddMember={handleAddMember}
          onNodeClick={onNodeClick}
        />
      )}

      {!data?.isAllFull && (
        <Button className="w-full mt-2" onClick={handleAddMember}>
          <UserRoundPlus className="w-5 h-5" />
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
