import { useNavigate, useLocation } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/Item"
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
      variant="content"
      barTitle={pageTitle}
      onBack={() => navigate(-1)}
      showStepper={false}
      headerIcon={
        <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-muted-foreground" />
        </div>
      }
      pageTitle="Start building your Circle!"
      description="Access interest-free loans to pay medical bills instantly with flexible terms."
      footer={
        <PrimaryCTAFooter
          label="Continue"
          onClick={handleContinue}
          className="bg-muted"
        />
      }
    >
      {/* Steps list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground tracking-wide px-2">
          Information being collected:
        </p>
        <ItemGroup className="gap-1">
          {steps.map((step) => (
            <Item key={step.number} size="sm">
              <span className="font-mono text-sm text-muted-foreground w-5 text-right flex-shrink-0">
                {step.number}
              </span>
              <ItemContent>
                <ItemTitle>{step.label}</ItemTitle>
                {step.optional && <ItemDescription>Optional</ItemDescription>}
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </div>
    </PatientPageWrapper>
  )
}
