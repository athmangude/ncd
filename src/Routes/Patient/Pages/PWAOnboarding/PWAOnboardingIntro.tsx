import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import { Check, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import { usePWAOnboardingStatus, PWA_STEP_CONFIG, getFirstIncompletePWAOnboardingStep } from "../../hooks/useNextPWAOnboardingStep"
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
    <MobileWrapper
      header={<BackTitleHeader title="" onBack={() => navigate(-1)} />}
      footer={
        <div className="flex flex-col gap-2 border-t border-neutral-100 bg-white p-4">
          <Button
            className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white"
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
        <div className="flex flex-col items-center gap-2 mb-8 mt-4">
            <div className="relative">
                <img
                    src={pwaSetup} 
                    alt="PWA Setup"
                    className="w-16 h-16 mb-4"
                    aria-hidden="true"
                />
            </div>
          
            <h1 className="text-2xl font-semibold text-center text-neutral-900">Get the full experience</h1>
            
            <p className="text-neutral-500 text-center text-sm px-4">
            Install the app, enable notifications and location for a seamless experience.
            </p>
            
            <div className="bg-[#F3E8FF] text-[#7E22CE] px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 mt-2">
                <Clock size={14} />
                Only takes 1min!
            </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
            <p className="text-neutral-500 text-sm font-medium">
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
                          ? "bg-green-50 border-green-500"
                          : "bg-white border-neutral-200"
                    )}
                >
                    <div className="flex items-center gap-4">
                    <span
                        className={cn(
                        "text-sm font-medium text-neutral-500",
                        )}
                    >
                        {step.id}
                    </span>
                    <div>
                    <div
                        className={cn(
                        "font-medium text-sm text-neutral-900 ",
                        )}
                    >
                        {step.label}
                    </div>
                    {step.description && (
                        <div
                            className={cn(
                            "font-normal text-sm text-neutral-700",
                            )}
                        >
                            {step.description}
                        </div>
                    )}
                    </div>
                    </div>

                    {isCompleted && (
                        <div className="rounded-full border border-green-500 p-0.5">
                            <Check className="text-green-500 w-3 h-3" strokeWidth={3} />
                        </div>
                    )}
                </div>
                )
            })}
            </div>
        </div>
      </div>
    </MobileWrapper>
  )
}
