import { useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  CheckCircle2,
  Plus,
  Info,
  ChevronRight,
  CircleAlert,
} from "lucide-react"
import { Button } from "@/components/Button"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import { useOfflinePatientData } from "@/hooks/useOfflinePatientData"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import useNextKYCStep from "../../hooks/useNextKYCStep"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { trackEvent, EVENTS } from "@/analytics"
import PatientPageWrapper from "../PatientPageWrapper"

// ── Types ────────────────────────────────────────────────────────────────────

type NetworkMember = {
  id: string
  firstName: string
  lastName: string
  phoneNumber?: string
  relationship: string
  status: string
  profilePhoto?: string | null
}

type ViewState = "empty" | "partial" | "waiting" | "complete"

// ── Viz slots ─────────────────────────────────────────────────────────────────

function EmptySlot({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-12 h-12 rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center shrink-0"
      aria-label="Empty circle slot"
    >
      <Plus className="w-5 h-5 text-neutral-400" />
    </button>
  )
}

function AcceptedSlot({
  member,
  onClick,
}: {
  member: NetworkMember
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full focus:outline-none"
      aria-label={`${member.firstName} ${member.lastName}`}
    >
      <ProfileAvatar
        firstName={member.firstName}
        lastName={member.lastName}
        src={member.profilePhoto}
        className="w-12 h-12 border-2 border-green-400"
      />
    </button>
  )
}

function PendingSlot({
  member,
  onClick,
}: {
  member: NetworkMember
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative shrink-0 focus:outline-none"
      style={{ width: 48, height: 63 }}
      aria-label={`${member.firstName} ${member.lastName} — waiting`}
    >
      <div className="absolute left-0 top-0 w-12 h-12 rounded-full border-2 border-orange-200 shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <ProfileAvatar
          firstName={member.firstName}
          lastName={member.lastName}
          src={member.profilePhoto}
          className="w-full h-full border-0"
        />
      </div>
      <span className="absolute top-0 right-0 z-10 w-2.5 h-2.5 rounded-full bg-orange-400" />
      <span
        className="absolute bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
        style={{ top: 39, left: -11 }}
      >
        Waiting...
      </span>
    </button>
  )
}

// ── Member list row ───────────────────────────────────────────────────────────

function MemberRow({
  member,
  badge,
  onClick,
}: {
  member: NetworkMember
  badge: "confirmed" | "pending"
  onClick?: () => void
}) {
  const phone = member.phoneNumber
    ? member.phoneNumber.replace(/(\d{3})(\d{3})(\d{3,4})/, "$1 $2 $3")
    : ""

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg w-full text-left"
      aria-label={`${member.firstName} ${member.lastName}`}
    >
      <ProfileAvatar
        firstName={member.firstName}
        lastName={member.lastName}
        src={member.profilePhoto}
        className="w-10 h-10 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900">
          {member.firstName} {member.lastName}
        </p>
        {phone && <p className="text-xs text-neutral-500">{phone}</p>}
      </div>
      {badge === "confirmed" ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
      ) : (
        <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
          Waiting...
        </span>
      )}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PatientKYCAddCircleMembers() {
  const navigate = useNavigate()
  const location = useLocation()
  const nextStep = useNextKYCStep()
  const user = usePatientAuthStore((state: any) => state.user)

  const {
    data: networkData,
    isLoading,
    isError,
    error,
    isOffline,
    refetch,
  } = useOfflinePatientData<{
    network: NetworkMember[]
    invites: NetworkMember[]
    receivedInvites: NetworkMember[]
  }>({
    endpoint: "/patient-network/network",
    fetchFn: async () => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/network`,
        { credentials: "include" }
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
      return resp.json()
    },
  })

  const allAdults = [
    ...(networkData?.network ?? []),
    ...(networkData?.invites ?? []),
  ].filter((m) => m.relationship !== "CHILD")

  const acceptedAdults: NetworkMember[] = allAdults.filter(
    (m) => m.status !== "PENDING"
  )
  const pendingAdults: NetworkMember[] = allAdults.filter(
    (m) => m.status === "PENDING"
  )

  const REQUIRED = 2

  // Once the participant has invited enough people to fill their Circle but some
  // invites are still pending, auto-accept them after a short delay so the
  // upgrade flow can proceed without a real recipient on the other end.
  const isAwaitingInviteAcceptance =
    acceptedAdults.length < REQUIRED &&
    pendingAdults.length > 0 &&
    acceptedAdults.length + pendingAdults.length >= REQUIRED

  const viewState: ViewState = (() => {
    if (!networkData) return "empty"
    if (acceptedAdults.length >= REQUIRED) return "complete"
    if (acceptedAdults.length > 0) return "partial"
    if (pendingAdults.length > 0) return "waiting"
    return "empty"
  })()

  useEffect(() => {
    try {
      trackEvent(EVENTS.KYC.ADD_CIRCLE_MEMBERS_VIEW)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (!networkData) return
    try {
      trackEvent(EVENTS.KYC.CIRCLE_STEP_STATE, { state: viewState } as any)
    } catch {
      // silent
    }
  }, [networkData, viewState])

  useEffect(() => {
    if (viewState !== "complete") return
    try {
      trackEvent(EVENTS.KYC.ADD_CIRCLE_MEMBERS_COMPLETE)
    } catch {
      // silent
    }
    navigate(nextStep || "/patients", { state: location.state, replace: true })
  }, [viewState, nextStep, navigate, location.state])

  // Keep the latest refetch without retriggering the timer every render
  // (useOfflinePatientData recreates refetch on each render).
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    if (!isAwaitingInviteAcceptance) return
    const timer = setTimeout(async () => {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/auto-accept-invites`,
          { method: "POST", credentials: "include" }
        )
      } catch {
        // best-effort — refetch below still reflects any server change
      }
      await refetchRef.current()
    }, 20000)
    return () => clearTimeout(timer)
    // refetch is read through a ref to avoid resetting the 20s timer each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAwaitingInviteAcceptance])

  const handleMemberClick = (memberId: string) => {
    navigate(`/patients/network/${memberId}`, {
      state: {
        ...location.state,
        returnPath: "/patients/kyc-add-circle-members",
      },
    })
  }

  const handleAddPerson = () => {
    try {
      trackEvent(EVENTS.KYC.ADD_CIRCLE_MEMBERS_ADD)
    } catch {
      // silent
    }
    navigate("/patients/network/add-circle-member", {
      state: {
        ...location.state,
        source: "onboarding",
        returnPath: "/patients/kyc-add-circle-members",
      },
    })
  }

  const handleCircleInfo = () => {
    navigate("/patients/circle-how-it-works", {
      state: {
        ...location.state,
        returnPath: "/patients/kyc-add-circle-members",
      },
    })
  }

  if (isLoading) return <LoadingPage />

  if (isError) {
    return (
      <ErrorBlock
        message={
          isOffline
            ? "You are offline and no cached data is available. Please connect to the internet."
            : (error as any)?.response?.data?.message || (error as any)?.message
        }
      />
    )
  }

  // ── Derived display values ────────────────────────────────────────────────

  const slotsNeeded = Math.max(0, REQUIRED - acceptedAdults.length)

  const title = {
    empty: "Add 2 people\nto your Jireh Circle",
    partial: "Waiting for your Circle to confirm",
    waiting: "Waiting for your Circle\nto confirm",
    complete: "",
  }[viewState]

  const subtitle = {
    empty:
      "To access loans, your Circle needs more strength. Invite at least 2 adults to unlock.",
    partial: `${slotsNeeded} more adult${slotsNeeded === 1 ? "" : "s"} needed to activate your Circle.`,
    waiting: "Your invites are out.\nYour Circle is active once they accept.",
    complete: "",
  }[viewState]

  const captionText = {
    empty: `${REQUIRED} of ${REQUIRED} adults slots available`,
    partial: `${acceptedAdults.length} of ${REQUIRED} adults confirmed`,
    waiting: `${Math.min(pendingAdults.length, REQUIRED)} of ${REQUIRED} adults slots pending`,
    complete: "",
  }[viewState]

  const ctaLabel = viewState === "empty" ? "Add person" : "Add another person"

  // Viz: fill slots with accepted first, then pending to fill remaining
  const displaySlots = [
    ...acceptedAdults.slice(0, REQUIRED),
    ...pendingAdults.slice(0, Math.max(0, REQUIRED - acceptedAdults.length)),
  ]
  const slot1 = displaySlots[0] ?? null
  const slot2 = displaySlots[1] ?? null

  return (
    <PatientPageWrapper
      title="Upgrade to Jireh Plus"
      footer={
        <div className="bg-white border-t border-neutral-100 p-4">
          <div className="flex flex-col gap-3">
            {viewState === "waiting" && (
              <div className="flex gap-2 items-start bg-orange-50 px-3 py-2 rounded-md">
                <CircleAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Your Circle is not yet active.
                  </p>
                  <p className="text-sm text-neutral-500">
                    Slots stay open until each person accepts your invite.
                  </p>
                  {isAwaitingInviteAcceptance && (
                    <p className="text-sm font-medium text-orange-700 mt-1">
                      Confirming your Circle automatically…
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button
              className="w-full bg-[#b325ff] hover:bg-[#9a1fd4] text-white"
              onClick={handleAddPerson}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      }
    >
      {/* Body */}
      <div className="pt-2">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <h1 className="text-xl font-medium text-neutral-900 text-center leading-tight whitespace-pre-line">
            {title}
          </h1>
          <p className="text-sm text-neutral-600 text-center whitespace-pre-line px-4">
            {subtitle}
          </p>

          {/* Info chip */}
          <button
            type="button"
            onClick={handleCircleInfo}
            className="flex items-center gap-2 bg-teal-50 text-neutral-900 text-sm px-3 py-1.5 rounded-md mt-1"
          >
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>What is a Jireh Circle?</span>
            <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>
        </div>

        {/* Circle viz */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center justify-center gap-4">
            {/* Left slot */}
            {slot1 ? (
              slot1.status === "PENDING" ? (
                <PendingSlot
                  member={slot1}
                  onClick={() => handleMemberClick(slot1.id)}
                />
              ) : (
                <AcceptedSlot
                  member={slot1}
                  onClick={() => handleMemberClick(slot1.id)}
                />
              )
            ) : (
              <EmptySlot onClick={handleAddPerson} />
            )}

            <div className="h-px w-6 bg-neutral-300" />

            {/* User avatar (centre) */}
            <ProfileAvatar
              firstName={user?.firstName}
              lastName={user?.lastName}
              src={user?.profilePhoto}
              className="w-[84px] h-[84px] border-2 border-[#dfacff]"
            />

            <div className="h-px w-6 bg-neutral-300" />

            {/* Right slot */}
            {slot2 ? (
              slot2.status === "PENDING" ? (
                <PendingSlot
                  member={slot2}
                  onClick={() => handleMemberClick(slot2.id)}
                />
              ) : (
                <AcceptedSlot
                  member={slot2}
                  onClick={() => handleMemberClick(slot2.id)}
                />
              )
            ) : (
              <EmptySlot onClick={handleAddPerson} />
            )}
          </div>

          <p className="text-sm text-neutral-500 text-center">{captionText}</p>
        </div>

        {/* Member lists */}
        <div className="flex flex-col gap-4 w-full">
          {acceptedAdults.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-neutral-500 px-2">
                Confirmed:
              </p>
              <div className="flex flex-col gap-1">
                {acceptedAdults.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    badge="confirmed"
                    onClick={() => handleMemberClick(m.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {pendingAdults.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-neutral-500 px-2">
                Invites sent to:
              </p>
              <div className="flex flex-col gap-1">
                {pendingAdults.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    badge="pending"
                    onClick={() => handleMemberClick(m.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PatientPageWrapper>
  )
}
