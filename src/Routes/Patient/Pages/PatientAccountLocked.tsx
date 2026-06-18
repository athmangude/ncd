import { Button } from "@/components/Button"
import PatientPageWrapper from "./PatientPageWrapper"
import { Phone } from "lucide-react"
import { useNavigate } from "react-router-dom"
import pinProtectErrorIcon from "@/assets/icons/pin-protect-error.svg"

export default function PatientAccountLocked() {
  const navigate = useNavigate()
  return (
    <PatientPageWrapper
      title="Account Locked"
      isRoot={true}
      className="text-center gap-7 "
    >
      <img
        src={pinProtectErrorIcon}
        alt="Pin protect error icon"
        className="w-32 h-32 mx-auto  mt-20"
      />
      <h1 className="text-3xl font-medium">This account has been locked.</h1>
      <p className="text-neutral-500 max-w-[35ch] mx-auto">
        Internal payments are temporarily blocked for your security. Please
        contact Jireh Support to reset your PIN.
      </p>
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
