import { useNavigate } from "react-router-dom"
import PatientAuthHeadline from "./PatientAuthHeadline"
import PatientPageWrapper from "@/Routes/Patient/Pages/PatientPageWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

export function DetailsNotSet({ title }: { title: string }) {
  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }

  return (
    <PatientPageWrapper
      title=""
      onBack={goBack}
      footer={<PrimaryCTAFooter label="Back" onClick={goBack} />}
    >
      <PatientAuthHeadline text={title} />
    </PatientPageWrapper>
  )
}
