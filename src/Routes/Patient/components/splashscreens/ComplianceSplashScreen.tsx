import AppShell from "@/Routes/AppShell"
import { LogoHeader } from "@/Routes/shell/headers"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import SplashScreenProgressBar from "@/Routes/SplashScreenProgressBar"
import { useNavigate } from "react-router-dom"

export default function ComplianceSplashScreen() {
  const navigate = useNavigate()

  return (
    <AppShell
      header={
        <LogoHeader
          showIcons={false}
          rightSlot={<SplashScreenProgressBar currentStep={5} />}
        />
      }
      footer={
        <PrimaryCTAFooter
          label="Login"
          onClick={() => navigate("/patients/auth/login")}
        />
      }
    >
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          We take your protection very seriously
        </h1>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-base font-medium text-neutral-600">
            We are compliant with:
          </h2>
          <img
            src="/kenya-court-of-arms.png"
            alt="Kenya Court of Arms"
            className="max-h-36"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-base font-medium text-neutral-600">
            Our team&apos;s worked at:
          </h2>
          <img src="/world-bank.png" alt="World Bank" className="max-h-44" />
        </div>
      </div>
    </AppShell>
  )
}
