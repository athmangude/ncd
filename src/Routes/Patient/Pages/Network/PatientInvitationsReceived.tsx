import { usePatientNetwork } from "@/hooks/usePatientNetwork"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { ReceivedInviteItem } from "./components/ReceivedInviteItem"
import { useNavigate } from "react-router-dom"

export default function PatientInvitationsReceived() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, isOffline } = usePatientNetwork()

  if (isLoading) {
    return <LoadingPage />
  }

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

  const { receivedInvites = [] } = data || {}

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title={`Invitations Received (${receivedInvites.length})`}
          onBack={() => navigate("/patients", { state: { tab: "circle" } })}
        />
      }
      footer={null}
    >
      <div className="flex flex-col gap-3 mt-4">
        <div className="text-muted-foreground mb-2">
          Received ({receivedInvites.length})
        </div>
        {receivedInvites.length === 0 ? (
          <div className="text-muted-foreground text-sm pl-8">
            No received invitations
          </div>
        ) : (
          receivedInvites.map((invite) => (
            <ReceivedInviteItem key={invite.id} {...invite} />
          ))
        )}
      </div>
    </MobileWrapper>
  )
}
