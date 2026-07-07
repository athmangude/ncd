import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import { Check, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import {
  usePWAOnboardingStatus,
  PWA_STEP_CONFIG,
  getFirstIncompletePWAOnboardingStep,
} from "../../hooks/useNextPWAOnboardingStep"
import pwaSetup from "@/assets/icons/pwa-setup.png"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"

export default function PWAOnboardingIntro() {
  const navigate = useNavigate()
  const { stepStatus, loading } = usePWAOnboardingStatus()

  useEffect(() => {
    trackEvent(EVENTS.PWA_INSTALL.ONBOARDING_INTRO_VIEW)
  }, [])

  // Determine next step
  const nextStepRoute = getFirstIncompletePWAOnboardingStep(stepStatus)

  return (
    <PatientPageWrapper
      variant="content"
      headerIcon={<img src={pwaSetup} alt="" className={HERO_ILLUSTRATION} />}
      pageTitle="Get the full experience"
      description="Install the app, enable notifications and location for a seamless experience."
      headerAction={
        <div className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
          <Clock size={14} />
          Only takes 1min!
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 border-t border-border bg-white p-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            disabled={loading}
            onClick={() => {
              navigate(nextStepRoute)
            }}
          >
            Personalise my care <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            disabled={loading}
            onClick={() => {
              navigate("/patients")
            }}
          >
            Take me to my dashboard <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div>
        <div className="flex flex-col gap-4 w-full">
          <p className="text-muted-foreground text-sm font-medium">
            Steps to complete:
          </p>
          <div className="flex flex-col gap-3">
            {PWA_STEP_CONFIG.map((step) => {
              const isCompleted = stepStatus[step.id]

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    isCompleted
                      ? "bg-success border-success-solid"
                      : "bg-white border-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-sm font-medium text-muted-foreground"
                      )}
                    >
                      {step.id}
                    </span>
                    <div>
                      <div
                        className={cn("font-medium text-sm text-foreground ")}
                      >
                        {step.label}
                      </div>
                      {step.description && (
                        <div
                          className={cn("font-normal text-sm text-foreground")}
                        >
                          {step.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="rounded-full border border-success-solid p-0.5">
                      <Check
                        className="text-success-solid w-3 h-3"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
