import { useNavigate } from "react-router-dom"
import PatientAuthHeadline from "./PatientAuthHeadline"
import AppShell from "@/Routes/AppShell"
import { BackTitleHeader } from "@/Routes/shell/headers"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

export function DetailsNotSet({ title }: { title: string }) {
  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }

  return (
    <AppShell
      header={<BackTitleHeader title="" onBack={goBack} />}
      footer={<PrimaryCTAFooter label="Back" onClick={goBack} />}
    >
      <PatientAuthHeadline text={title} />
    </AppShell>
  )
}
