import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import ErrorBlock from "@/components/ErrorBlock"
import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { trackEvent, EVENTS } from "@/analytics"
import { InviteCard } from "./components/InviteCard"
import { InvitationsReceivedSection } from "./components/InvitationsReceivedSection"
import { InvitationsSentSection } from "./components/InvitationsSentSection"
import { ActiveMembersSection } from "./components/ActiveMembersSection"
import { NetworkSkeleton } from "./components/NetworkSkeleton"
import { useNetworkData } from "./hooks/useNetworkData"

export default function PatientMyNetworkPage() {
  const navigate = useNavigate()
  // React Query dedupes on myNetworkQueryKey, so reading isAllFull here for the
  // pinned footer shares the same cache entry MyNetwork uses below — no extra
  // request.
  const { data } = useNetworkData()
  const isAllFull = data?.isAllFull ?? false

  const goToAddMember = () =>
    navigate("/patients/circle-setup-intro", {
      state: { source: "network", returnPath: "/patients/network" },
    })

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title="My Circle Members"
          onBack={() => navigate("/patients", { state: { tab: "circle" } })}
        />
      }
      footer={
        <PrimaryCTAFooter
          label={isAllFull ? "Max circle size reached" : "Add New member"}
          onClick={goToAddMember}
          disabled={isAllFull}
        />
      }
    >
      <PatientMyNetwork />
    </MobileWrapper>
  )
}

export function PatientMyNetwork() {
  return (
    <div className="w-full">
      <MyNetwork />
    </div>
  )
}

export const myNetworkQueryKey = "myConnectionsKey"

function MyNetwork() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.CIRCLE.NETWORK_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const goToAddMember = () =>
    navigate("/patients/circle-setup-intro", {
      state: { source: "network", returnPath: "/patients/network" },
    })

  // Deep-link: ?add=1 from the Circle Status section opens the add-member page.
  useEffect(() => {
    if (searchParams.get("add") !== "1") return
    const next = new URLSearchParams(searchParams)
    next.delete("add")
    setSearchParams(next, { replace: true })
    navigate("/patients/circle-setup-intro", {
      state: { source: "network", returnPath: "/patients/network" },
    })
  }, [searchParams, setSearchParams, navigate])

  // Deep-link: ?focus=<id> scrolls a matching member card into view.
  // Falls back silently when the element isn't rendered yet.
  useEffect(() => {
    const focusId = searchParams.get("focus")
    if (!focusId) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`circle-member-${focusId}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      const next = new URLSearchParams(searchParams)
      next.delete("focus")
      setSearchParams(next, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchParams, setSearchParams])

  const { data, isLoading, isError, error } = useNetworkData()

  // Simple offline check for error message
  const isOffline = !navigator.onLine

  if (isError) {
    return (
      <ErrorBlock
        message={
          isOffline
            ? "You are offline and no cached data is available. Please connect to the internet to load your dashboard."
            : (error as any)?.response?.data?.message || (error as any)?.message
        }
      />
    )
  }

  const handleInviteClick = () => goToAddMember()

  // Default values for when data is not yet loaded
  const networkData = data || {
    network: [],
    invites: [],
    receivedInvites: [],
    slots: undefined,
    adults: [],
    children: [],
    isAccountableFull: false,
    isAuxiliaryFull: false,
    isAllFull: false,
    accountableSlotsAvailable: 0,
    accountableSlotsMax: 0,
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <InviteCard onInviteClick={handleInviteClick} />

      {isLoading ? (
        <NetworkSkeleton />
      ) : (
        <>
          <InvitationsReceivedSection
            receivedInvites={networkData.receivedInvites}
          />
          <InvitationsSentSection invites={networkData.invites} />
          <ActiveMembersSection
            network={networkData.network}
            adults={networkData.adults}
            children={networkData.children}
            slots={networkData.slots}
            accountableSlotsAvailable={networkData.accountableSlotsAvailable}
            accountableSlotsMax={networkData.accountableSlotsMax}
          />
        </>
      )}
    </div>
  )
}
