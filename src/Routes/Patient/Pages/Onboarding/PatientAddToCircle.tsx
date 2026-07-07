import PatientPageWrapper from "../PatientPageWrapper"
import { Button } from "@/components/Button"
import { SectionTitle } from "@/components/SectionTitle"
import { useLocation, useNavigate } from "react-router-dom"
import useNextCircleSetupStep from "../../hooks/useNextCircleSetupStep"
import { DetailsNotSet } from "../../components/DetailsNotSet"
import networkCircleIcon from "@/assets/icons/network-circle.png"
import { Plus } from "lucide-react"

import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { NetworkItem } from "../Network/components/NetworkItem"
import { useOfflinePatientData } from "@/hooks/useOfflinePatientData"
import ErrorBlock from "@/components/ErrorBlock"
import LoadingPage from "@/Routes/LoadingPage"

export default function PatientAddToCircle() {
  const navigate = useNavigate()
  const next = useNextCircleSetupStep()

  const location = useLocation()
  const state = location.state

  const user = usePatientAuthStore((state) => state.user)
  const { type } = user || {}

  const { data, isLoading, isError, error, isOffline } = useOfflinePatientData<{
    network: any[]
    invites: any[]
    receivedInvites: any[]
  }>({
    endpoint: "/patient-network/network",
    fetchFn: async () => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/network`,
        {
          credentials: "include",
        }
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
      return resp.json()
    },
  })

  if (!state) {
    return (
      <DetailsNotSet title="It looks like you have not set some details yet" />
    )
  }

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

  const { network = [], invites = [] } = data || {}
  const allMembers = [...network, ...invites]

  const handleAddPeople = () => {
    navigate("/patients/network/add-circle-member", {
      state: {
        ...state,
        source: "onboarding",
        returnPath: "/patients/add-to-circle",
      },
    })
  }

  return (
    <PatientPageWrapper
      title="Add people"
      className="flex flex-col min-h-[calc(100vh-140px)] min-h-[calc(100dvh-140px)]"
    >
      <div className="flex-1 w-full flex flex-col gap-6">
        <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center text-center border border-purple-100 shadow-sm">
          <div className="bg-white rounded-full p-3 mb-4 shadow-sm relative">
            <img
              src={networkCircleIcon}
              alt="Network Circle"
              className="w-12 h-12 object-contain"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <h2 className="mb-2">Add people to your circle</h2>
          <p className="text-muted-foreground mb-6 text-sm max-w-[260px]">
            To unlock loans, invite 2+ trusted adults to your circle
          </p>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleAddPeople}
          >
            <Plus className="w-4 h-4 mr-2" /> Add people
          </Button>
        </div>

        {allMembers.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionTitle level={3} className="ml-1">
              Added Members
            </SectionTitle>
            {allMembers.map((member) => (
              <NetworkItem
                key={member.id}
                {...member}
                firstName={member.firstName}
                lastName={member.lastName}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 space-y-3">
        <Button
          disabled={allMembers.length === 0}
          className="w-full"
          onClick={() =>
            navigate(next, {
              state: {
                ...state,
                circleMembers: allMembers,
                tab: "circle",
              },
            })
          }
        >
          Continue
        </Button>

        {type === "ORG" && (
          <Button
            className="w-full"
            variant="ghost"
            onClick={() =>
              navigate(next, {
                state: {
                  ...state,
                  circleMembers: [],
                },
              })
            }
          >
            Skip for now
          </Button>
        )}
      </div>
    </PatientPageWrapper>
  )
}
