import PatientPageWrapper from "./PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
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
      dualCta={{
        primary: {
          label: "Call Jireh Support",
          onClick: () => {
            window.location.href = "tel:+254117118511"
          },
        },
        secondary: {
          label: "Back To Dashboard",
          onClick: () => navigate("/patients"),
        },
      }}
    />
  )
}
