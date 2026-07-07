import { useEffect, useRef } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import PatientPageWrapper from "../PatientPageWrapper"
import { Skeleton } from "@/components/Skeleton"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS } from "@/analytics"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { LinkedAvatarPair } from "./components/memberDetails/LinkedAvatarPair"
import { OpenSlotCard } from "./components/memberDetails/OpenSlotCard"
import { useAcknowledgeRejection } from "./hooks/useAcknowledgeRejection"

interface AuthUser {
  firstName?: string
  lastName?: string
  profilePhoto?: string | null
}

interface RejectedInviteDetails {
  id: string
  status: string
  firstName: string
  lastName: string
  phoneNumber: string
  profilePhoto: string | null
  relationship?: string
}

export const patientInviteRejectedViewQueryKey = "patient-invite-rejected-view"

export default function PatientInviteRejectedView() {
  const { inviteId } = useParams<{ inviteId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const acknowledge = useAcknowledgeRejection()
  const ackFiredRef = useRef(false)

  const user = usePatientAuthStore((s) => s.user) as AuthUser | undefined
  const you = {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    profilePhoto: user?.profilePhoto ?? null,
  }

  const query = useQuery<RejectedInviteDetails>({
    queryKey: [patientInviteRejectedViewQueryKey, inviteId],
    enabled: Boolean(inviteId),
    queryFn: async () => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/invite/${inviteId}`,
        { credentials: "include" }
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
      return resp.json()
    },
  })

  useEffect(() => {
    if (query.isError) {
      toast({
        title: "This invite is no longer available.",
        description: "Returning to your Circle.",
        variant: "destructive",
      })
      navigate("/patients/circle")
      return
    }
    if (!query.data) return
    if (query.data.status !== "REJECTED") {
      toast({
        title: "This invite is no longer available.",
        description: `Status: ${query.data.status.toLowerCase()}`,
      })
      navigate("/patients/circle")
      return
    }
    if (!ackFiredRef.current && inviteId) {
      ackFiredRef.current = true
      trackEvent(EVENTS.CIRCLE.INVITE_REJECTED_VIEW)
      acknowledge.mutate(inviteId)
    }
  }, [query.data, query.isError, inviteId, navigate, toast, acknowledge])

  return (
    <PatientPageWrapper
      title="Invite Rejected"
      onBack={() => navigate("/patients/circle")}
    >
      {query.isLoading && (
        <div
          data-testid="invite-rejected-skeleton"
          className="flex flex-col gap-4 pt-4"
        >
          <Skeleton className="mx-auto h-20 w-44 rounded-full" />
          <Skeleton className="h-6 w-2/3 mx-auto rounded" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      )}
      {!query.isLoading && query.data && query.data.status === "REJECTED" && (
        <div className="flex flex-col gap-6 pt-2">
          <LinkedAvatarPair
            you={you}
            them={{
              firstName: query.data.firstName ?? "",
              lastName: query.data.lastName ?? "",
              profilePhoto: query.data.profilePhoto ?? null,
            }}
            variant="rejected"
          />
          <p className="text-center text-lg font-medium">
            {query.data.firstName} chose not to join.
          </p>
          <OpenSlotCard
            firstName={query.data.firstName ?? ""}
            prefill={{
              firstName: query.data.firstName ?? "",
              lastName: query.data.lastName ?? "",
              phoneNumber: query.data.phoneNumber ?? "",
              relationship: query.data.relationship,
            }}
            onReinviteClick={() =>
              trackEvent(EVENTS.CIRCLE.INVITE_REJECTED_REINVITE_TAPPED)
            }
            onInviteNewClick={() =>
              trackEvent(EVENTS.CIRCLE.INVITE_REJECTED_INVITE_NEW_TAPPED)
            }
          />
          <Link
            to="/patients/circle"
            onClick={() =>
              trackEvent(EVENTS.CIRCLE.INVITE_REJECTED_SEE_CIRCLE_TAPPED)
            }
            className="mt-2 block rounded-xl border border-border py-3 text-center font-medium text-foreground"
          >
            See my Circle
          </Link>
        </div>
      )}
    </PatientPageWrapper>
  )
}
