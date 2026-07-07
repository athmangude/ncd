import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import successIcon from "@/assets/icons/care-profile-setup.png"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { ChevronRight, Phone } from "lucide-react"
import { useOnboardingChecklist } from "../../hooks/useOnboardingChecklist"

export default function PatientOnboardingSuccess() {
  const navigate = useNavigate()
  const { data, isLoading } = useOnboardingChecklist()

  // Wait for data to load to avoid flashing the wrong state
  if (isLoading) return null

  // Check if phone match failed (explicitly false)
  const showMatchWarning = data?.phoneNameMatch?.isMatch === false

  return (
    <PatientPageWrapper
      variant="content"
      isRoot={true}
      headerIcon={
        <img src={successIcon} alt="" className={HERO_ILLUSTRATION} />
      }
      pageTitle={showMatchWarning ? "Membership activated." : "Account Created"}
      description={
        showMatchWarning
          ? "...but you can only access basic features because your full name could not be verified against your phone number registration."
          : "Account created! Your Jireh Health account is ready."
      }
      footer={
        <PrimaryCTAFooter
          label={
            <span className="flex items-center justify-center gap-2">
              Take me to my dashboard
              <ChevronRight className="h-4 w-4" />
            </span>
          }
          onClick={() => navigate("/patients")}
        />
      }
    >
      <section className="text-center flex flex-col gap-5 items-center ">
        {showMatchWarning && (
          <div className="bg-card p-4 rounded-xl w-full border border-purple-100 shadow-sm text-left">
            <p className="text-sm text-muted-foreground mb-3">
              Contact our support team for help.
            </p>
            <a href="tel:+254117118511" className="block w-full">
              <Button variant="secondary" className="w-full">
                <Phone className="mr-2 h-4 w-4" /> Call Jireh Support
              </Button>
            </a>
          </div>
        )}
      </section>
    </PatientPageWrapper>
  )
}
