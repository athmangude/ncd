import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import successIcon from "@/assets/icons/care-profile-setup.png"
import MobileWrapper, {
  LogoHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
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
    <MobileWrapper
      header={<LogoHeader showIcons={false} className="flex justify-center" />}
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
      className="flex flex-col items-center justify-center"
    >
      <section className="text-center flex flex-col gap-5 items-center ">
        <img
          src={successIcon}
          alt="onboarding success"
          className="w-full max-w-[150px] mx-auto"
          aria-hidden="true"
        />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {showMatchWarning ? "Membership activated." : "Account Created"}
          </h1>
          <p className="text-muted-foreground max-w-[300px] mx-auto">
            {showMatchWarning
              ? "...but you can only access basic features because your full name could not be verified against your phone number registration."
              : "Account created! Your Jireh Health account is ready."}
          </p>
        </div>

        {showMatchWarning && (
          <div className="bg-white p-4 rounded-xl w-full border border-purple-100 shadow-sm text-left">
            <p className="text-sm text-neutral-600 mb-3">
              Contact our support team for help.
            </p>
            <a href="tel:+254117118511" className="block w-full">
              <Button
                variant="secondary"
                className="w-full bg-[#F3E8FF] text-[#9333EA] hover:bg-[#E9D5FF] border-none font-medium h-12"
              >
                <Phone className="mr-2 h-4 w-4" /> Call Jireh Support
              </Button>
            </a>
          </div>
        )}
      </section>
    </MobileWrapper>
  )
}
