import { useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { Skeleton } from "@/components/Skeleton"
import { trackEvent, EVENTS } from "@/analytics"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import type { PatientAuthState } from "../../stores/patientAuthStore"
import { useMemberById } from "./hooks/useMemberById"
import { getMemberDetailsVariant } from "./lib/getMemberDetailsVariant"
import { ConnectedNewBody } from "./components/memberDetails/bodies/ConnectedNewBody"
import { ConnectedEstablishedBody } from "./components/memberDetails/bodies/ConnectedEstablishedBody"
import { PendingInviteBody } from "./components/memberDetails/bodies/PendingInviteBody"
import { RejectedInviteBody } from "./components/memberDetails/bodies/RejectedInviteBody"
import type { NetworkMember, SentInvite } from "@/hooks/usePatientNetwork"

interface AuthUser {
  firstName?: string
  lastName?: string
  profilePhoto?: string | null
}

export default function PatientCircleMemberDetails() {
  const navigate = useNavigate()
  const { targetId } = useParams<{ targetId: string }>()
  const { subject, kind, isLoading, notFound } = useMemberById(targetId)

  const user = usePatientAuthStore((s: PatientAuthState) => s.user) as
    | AuthUser
    | undefined
  const you = {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    profilePhoto: user?.profilePhoto ?? null,
  }

  const variant =
    subject && kind ? getMemberDetailsVariant(subject, kind) : null

  useEffect(() => {
    if (variant) trackEvent(EVENTS.CIRCLE.MEMBER_DETAILS_VIEW, { variant })
  }, [variant])

  return (
    <PatientPageWrapper
      title="Circle member details"
      onBack={() => navigate(-1)}
      footer={null}
    >
      {isLoading && (
        <div
          data-testid="member-details-skeleton"
          className="flex flex-col gap-4 pt-4"
        >
          <Skeleton className="mx-auto h-20 w-44 rounded-full" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      )}
      {!isLoading && notFound && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-foreground">
            This member is no longer in your Circle.
          </p>
          <Link
            to="/patients/circle"
            className="rounded-full bg-purple-600 px-5 py-2 text-white"
          >
            Back to Circle
          </Link>
        </div>
      )}
      {!isLoading && subject && kind && variant && (
        <>
          {variant === "connected-new" && (
            <ConnectedNewBody member={subject as NetworkMember} you={you} />
          )}
          {variant === "connected-established" && (
            <ConnectedEstablishedBody
              member={subject as NetworkMember}
              you={you}
            />
          )}
          {variant === "pending" && (
            <PendingInviteBody invite={subject as SentInvite} you={you} />
          )}
          {variant === "rejected" && (
            <RejectedInviteBody invite={subject as SentInvite} you={you} />
          )}
        </>
      )}
    </PatientPageWrapper>
  )
}
