import { useNavigate, useLocation } from "react-router-dom"
import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
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
    <MobileWrapper
      header={<BackTitleHeader title={pageTitle} onBack={() => navigate(-1)} />}
      footer={
        <PrimaryCTAFooter
          label="Continue"
          onClick={handleContinue}
          className="bg-[#f5f5f5]"
        />
      }
      className="p-0"
    >
      {/* Gray background matching Figma neutral-100 fills the scroll area */}
      <div className="bg-[#f5f5f5] px-4 pt-6 pb-4 flex flex-col gap-6 min-h-full">
        {/* Header: icon + title + subtitle */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-[#525252]" />
          </div>
          <h1 className="text-xl font-medium text-[#171717] tracking-tight leading-snug">
            Start building your Circle!
          </h1>
          <p className="text-sm text-[#525252] leading-5 max-w-xs">
            Access interest-free loans to pay medical bills instantly with
            flexible terms.
          </p>
        </div>

        {/* Steps list */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-[#737373] tracking-wide px-2 mb-2">
            Information being collected:
          </p>
          <div className="flex flex-col gap-1">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-md px-3 py-3 flex items-start gap-3 min-h-[44px]"
              >
                <span className="font-mono text-sm text-[#737373] w-5 text-right flex-shrink-0 mt-0.5">
                  {step.number}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-[#171717]">{step.label}</span>
                  {step.optional && (
                    <span className="text-xs text-[#737373]">Optional</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileWrapper>
  )
}
