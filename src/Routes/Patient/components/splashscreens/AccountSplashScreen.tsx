import AppShell from "@/Routes/AppShell"
import { LogoHeader } from "@/Routes/shell/headers"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import SplashScreenProgressBar from "@/Routes/SplashScreenProgressBar"
import { Check } from "lucide-react"
import { useNavigate } from "react-router-dom"

const STEPS = [
  "Sign up for Jireh Health Membership",
  "Get approved",
  "Request treatment funding",
  "Jireh pays for your medical bill",
  "Get the quality care you deserve",
]

export default function AccountSplashScreen() {
  const navigate = useNavigate()

  return (
    <AppShell
      header={
        <LogoHeader
          showIcons={false}
          rightSlot={<SplashScreenProgressBar currentStep={4} />}
        />
      }
      footer={
        <PrimaryCTAFooter
          label="Login"
          onClick={() => navigate("/patients/auth/login")}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Create your account in a few easy steps
        </h1>

        <ol className="flex flex-col gap-4">
          {STEPS.map((step) => (
            <li key={step} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-3 w-3" />
              </span>
              <span className="font-medium text-neutral-900">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  )
}
