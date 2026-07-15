import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import { Check, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import PatientPageWrapper from "../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/Item"
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
      barTitle="Set up app"
      headerIcon={<img src={pwaSetup} alt="" className={HEADER_ICON} />}
      pageTitle="Get the full experience"
      description="Install the app, enable notifications and location for a seamless experience."
      headerAction={
        <div className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
          <Clock size={14} />
          Only takes 1min!
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 border-t border-border bg-card p-4">
          <Button
            className="w-full"
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
        <div className="flex flex-col gap-2 w-full">
          <p className="text-muted-foreground text-sm font-medium">
            Steps to complete:
          </p>
          <ItemGroup className="gap-1.5">
            {PWA_STEP_CONFIG.map((step) => {
              const isCompleted = stepStatus[step.id]

              return (
                <Item
                  key={step.id}
                  size="sm"
                  variant="outline"
                  className={cn(
                    isCompleted && "bg-success border-success-solid"
                  )}
                >
                  <span className="text-sm font-medium text-muted-foreground shrink-0">
                    {step.id}
                  </span>
                  <ItemContent>
                    <ItemTitle className="text-foreground">
                      {step.label}
                    </ItemTitle>
                    {step.description && (
                      <ItemDescription className="text-foreground">
                        {step.description}
                      </ItemDescription>
                    )}
                  </ItemContent>

                  {isCompleted && (
                    <ItemActions>
                      <div className="rounded-full border border-success-solid p-0.5">
                        <Check
                          className="text-success-solid w-3 h-3"
                          strokeWidth={3}
                        />
                      </div>
                    </ItemActions>
                  )}
                </Item>
              )
            })}
          </ItemGroup>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
