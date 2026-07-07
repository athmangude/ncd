import { Button } from "@/components/Button"
import PatientPageWrapper from "./PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import { Phone } from "lucide-react"
import { useNavigate } from "react-router-dom"
import pinProtectErrorIcon from "@/assets/icons/pin-protect-error.svg"

export default function PatientAccountLocked() {
  const navigate = useNavigate()
  return (
    <PatientPageWrapper
      variant="content"
      isRoot={true}
      headerIcon={
        <img
          src={pinProtectErrorIcon}
          alt="Pin protect error icon"
          className={HERO_ILLUSTRATION}
        />
      }
      pageTitle="This account has been locked."
      description="Internal payments are temporarily blocked for your security. Please contact Jireh Support to reset your PIN."
      className="text-center gap-7 "
    >
      <a href="tel:+254117118511" className="no-underline w-full">
        <Button type="button" role="link" size="lg" className="w-full">
          <Phone className="w-5 h-5 mr-2" />
          Call Jireh Support
        </Button>
      </a>

      <Button variant="outline" onClick={() => navigate("/patients")}>
        Back To Dashboard
      </Button>
    </PatientPageWrapper>
  )
}
