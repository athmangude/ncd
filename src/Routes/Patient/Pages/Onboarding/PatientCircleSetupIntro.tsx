import { useNavigate, useLocation } from "react-router-dom"
import { CircleSetupContent } from "./CircleSetupContent"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"

type LocationState = {
  source?: string
  returnPath?: string
  [key: string]: unknown
}

export default function PatientCircleSetupIntro() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as LocationState

  const handleBack = () => {
    if (state.returnPath) {
      navigate(state.returnPath as string)
    } else {
      navigate(-1)
    }
  }

  const handleAddMember = () =>
    navigate("/patients/network/invite-method", { state })

  const handleNodeClick = (id: string) =>
    navigate(`/patients/network/${id}`, { state })

  const handleLearnMore = () =>
    navigate("/patients/circle-how-it-works", { state })

  return (
    <MobileWrapper
      header={<BackTitleHeader title="My Jireh Circle" onBack={handleBack} />}
      footer={null}
    >
      <CircleSetupContent
        onAddMember={handleAddMember}
        onNodeClick={handleNodeClick}
        onLearnMore={handleLearnMore}
      />
    </MobileWrapper>
  )
}
