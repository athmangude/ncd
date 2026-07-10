import { useNavigate, useLocation } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { UserPlus } from "lucide-react"

type LocationState = {
  inviteMethod?: "text" | "voice"
  source?: string
  returnPath?: string
  [key: string]: unknown
}

type InfoStep = {
  number: string
  label: string
  optional?: boolean
}

const SMS_STEPS: InfoStep[] = [
  { number: "01", label: "Add contact details" },
  { number: "02", label: "Write your message" },
  { number: "03", label: "Add a profile photo", optional: true },
  { number: "04", label: "Preview and send!" },
]

const VOICE_STEPS: InfoStep[] = [
  { number: "01", label: "Add contact details" },
  { number: "02", label: "Record your message" },
  { number: "03", label: "Add a profile photo", optional: true },
  { number: "04", label: "Preview and send!" },
]

export default function InviteMethodInfoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as LocationState
  const isVoice = state.inviteMethod === "voice"

  const pageTitle = isVoice ? "Invite by voice note" : "Invite by SMS"
  const steps = isVoice ? VOICE_STEPS : SMS_STEPS

  const handleContinue = () => {
    navigate("/patients/network/add-circle-member", { state })
  }

  return (
    <PatientPageWrapper
      title={pageTitle}
      onBack={() => navigate(-1)}
      footer={
        <PrimaryCTAFooter
          label="Continue"
          onClick={handleContinue}
          className="bg-muted"
        />
      }
      bodyPadding="none"
      className="p-0"
    >
      {/* Neutral background fills the scroll area */}
      <div className="bg-muted px-4 pt-6 pb-4 flex flex-col gap-6 min-h-full">
        {/* Header: icon + title + subtitle */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="leading-snug">Start building your Circle!</h1>
          <p className="text-sm text-muted-foreground leading-5 max-w-xs">
            Access interest-free loans to pay medical bills instantly with
            flexible terms.
          </p>
        </div>

        {/* Steps list */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground tracking-wide px-2 mb-2">
            Information being collected:
          </p>
          <div className="flex flex-col gap-1">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-card rounded-md px-3 py-3 flex items-start gap-3 min-h-[44px]"
              >
                <span className="font-mono text-sm text-muted-foreground w-5 text-right flex-shrink-0 mt-0.5">
                  {step.number}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-foreground">{step.label}</span>
                  {step.optional && (
                    <span className="text-xs text-muted-foreground">
                      Optional
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
