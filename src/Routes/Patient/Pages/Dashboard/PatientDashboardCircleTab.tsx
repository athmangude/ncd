import { TabsContent } from "@radix-ui/react-tabs"
import { useNavigate } from "react-router-dom"
import { CircleSetupContent } from "../Onboarding/CircleSetupContent"
import { useNetworkData } from "../Network/hooks/useNetworkData"
import { DashboardSection } from "./components/DashboardStagger"
import { DashboardSkeleton } from "./components/DashboardSkeleton"
import { useDashboardFirstLoad } from "./hooks/useDashboardFirstLoad"

export default function PatientDashboardCircleTab() {
  const navigate = useNavigate()
  const state = { source: "circle-tab", returnPath: "/patients/circle" }
  const { data, isLoading } = useNetworkData()

  const { showSkeleton, mode: animationMode } = useDashboardFirstLoad(
    isLoading,
    data != null
  )

  const handleAddMember = () =>
    navigate("/patients/network/invite-method", { state })

  const handleNodeClick = (id: string) =>
    navigate(`/patients/network/${id}`, { state })

  const handleLearnMore = () =>
    navigate("/patients/circle-how-it-works", { state })

  return (
    <TabsContent value="circle" className="flex flex-col gap-7">
      {showSkeleton ? (
        <DashboardSkeleton sections={1} />
      ) : (
        <DashboardSection mode={animationMode}>
          <CircleSetupContent
            onAddMember={handleAddMember}
            onNodeClick={handleNodeClick}
            onLearnMore={handleLearnMore}
          />
        </DashboardSection>
      )}
    </TabsContent>
  )
}
