import { useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import careProfileSetup from "@/assets/icons/care-profile-setup.png"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

export default function CareProfileSuccess() {
  const navigate = useNavigate()

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Profile complete"
      isRoot={true}
      headerIcon={
        <img src={careProfileSetup} alt="" className={HERO_ILLUSTRATION} />
      }
      pageTitle="Jireh profile complete!"
      description="We will connect you with the right providers for tailored offers."
      footer={
        <PrimaryCTAFooter
          label={
            <span className="flex items-center justify-center gap-2">
              Go to my dashboard
              <ChevronRight className="w-5 h-5" />
            </span>
          }
          onClick={() => navigate("/patients/")}
        />
      }
    />
  )
}
