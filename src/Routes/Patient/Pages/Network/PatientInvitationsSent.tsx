import { usePatientNetwork } from "@/hooks/usePatientNetwork"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { NetworkItem } from "./components/NetworkItem"
import { useNavigate } from "react-router-dom"

export default function PatientInvitationsSent() {
  const navigate = useNavigate()
  const {
    data,
    isLoading,
    isError,
    error,
    isOffline,
  } = usePatientNetwork()

  if (isLoading) {
    return <LoadingPage />
  }

  if (isError) {
    return <ErrorBlock message={
      isOffline
        ? "You are offline and no cached data is available. Please connect to the internet to load your dashboard."
        : (error as any)?.response?.data?.message || (error as any)?.message
    }
  />
  }

  const { invites = [] } = data || {}

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title={`Invitations Sent (${invites.length})`}
          onBack={() => navigate("/patients", { state: { tab: "circle" } })}
        />
      }
      footer={null}
    >
      <div className="flex flex-col gap-3 mt-4">
        <div className="text-neutral-500 mb-2">Sent ({invites.length})</div>
        {invites.length === 0 ? (
          <div className="text-neutral-400 text-sm pl-8">No sent invitations</div>
        ) : (
          invites.map((n) => (
            <NetworkItem
              key={n.id}
              {...n}
              firstName={n.firstName}
              lastName={n.lastName}
            />
          ))
        )}
      </div>
    </MobileWrapper>
  )
}

