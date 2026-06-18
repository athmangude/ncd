import { TabsContent } from "@radix-ui/react-tabs"
import { useNavigate } from "react-router-dom"
import { CircleSetupContent } from "../Onboarding/CircleSetupContent"

export default function PatientDashboardCircleTab() {
  const navigate = useNavigate()
  const state = { source: "circle-tab", returnPath: "/patients/circle" }

  const handleAddMember = () =>
    navigate("/patients/network/invite-method", { state })

  const handleNodeClick = (id: string) =>
    navigate(`/patients/network/${id}`, { state })

  const handleLearnMore = () =>
    navigate("/patients/circle-how-it-works", { state })

  return (
    <TabsContent value="circle" className="flex flex-col gap-7">
      <CircleSetupContent
        onAddMember={handleAddMember}
        onNodeClick={handleNodeClick}
        onLearnMore={handleLearnMore}
      />
    </TabsContent>
  )
}
