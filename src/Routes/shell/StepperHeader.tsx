import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/Button"
import { Stepper } from "@/components/Stepper"
import { LOAN_APPLICATION_STEPS } from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import {
  CARE_PROFILE_STEPS,
  getCareProfileSteps,
} from "@/Routes/Patient/hooks/useNextCareProfileStep"
import { KYC_STEPS, getKYCSteps } from "@/Routes/Patient/hooks/useNextKYCStep"
import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_CONFIG,
} from "@/Routes/Patient/hooks/useNextOnboardingStep"
import {
  PWA_STEPS,
  PWA_STEP_CONFIG,
  usePWAOnboardingStatus,
} from "@/Routes/Patient/hooks/useNextPWAOnboardingStep"
import { FAST_TRACK_STEPS } from "@/Routes/Patient/hooks/useNextFastTrackStep"
import {
  CIRCLE_INVITE_SMS_STEPS,
  CIRCLE_INVITE_VOICE_STEPS,
} from "@/Routes/Patient/hooks/useNextCircleInviteStep"
import {
  usePatientAuthStore,
  type PatientAuthState,
} from "@/Routes/Patient/stores/patientAuthStore"

interface StepperHeaderProps {
  title?: string
  isRoot?: boolean
  showHelp?: boolean
  onBack?: () => void
  backIcon?: React.ReactNode
  rightAction?: React.ReactNode
}

/**
 * The pinned top bar for patient journey screens: a back button, optional title,
 * a right-action / "Need help?" slot, and a progress `Stepper` that detects which
 * of the seven onboarding/payment journeys the current route belongs to.
 *
 * Detection is route-driven (keyed off `location.pathname` + the auth store), so
 * this component is fully self-contained and can be dropped straight into the
 * AppShell `header` slot. Safe-area top inset is supplied by AppShell; horizontal
 * padding is supplied here since the bar no longer sits inside a padded container.
 */
export default function StepperHeader({
  title,
  isRoot = false,
  showHelp = false,
  onBack,
  backIcon,
  rightAction,
}: StepperHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user =
    usePatientAuthStore((state: PatientAuthState) => state.user) || {}

  const currentStepIndex = LOAN_APPLICATION_STEPS.indexOf(location.pathname)
  const showLoanApplicationStepper = currentStepIndex !== -1

  const careProfileStepIndex = CARE_PROFILE_STEPS.indexOf(location.pathname)
  const showCareProfileStepper = careProfileStepIndex !== -1

  const careProfileCompletedSteps = showCareProfileStepper
    ? getCareProfileSteps(user).map((step) => step.checkCompletion(user))
    : undefined

  const kycStepIndex = KYC_STEPS.indexOf(location.pathname)
  const showKycStepper = kycStepIndex !== -1

  const kycCompletedSteps = showKycStepper
    ? getKYCSteps(user).map((step) => step.checkCompletion(user))
    : undefined

  const onboardingStepIndex = ONBOARDING_STEPS.indexOf(location.pathname)
  const showOnboardingStepper = onboardingStepIndex !== -1

  const onboardingCompletedSteps = showOnboardingStepper
    ? ONBOARDING_STEP_CONFIG.map((step) => step.checkCompletion(user))
    : undefined

  const pwaStepIndex = PWA_STEPS.indexOf(location.pathname)
  const showPwaStepper = pwaStepIndex !== -1
  const { stepStatus: pwaStatus } = usePWAOnboardingStatus()

  const pwaCompletedSteps = showPwaStepper
    ? PWA_STEP_CONFIG.map((step) => pwaStatus[step.id])
    : undefined

  const fastTrackStepIndex = FAST_TRACK_STEPS.indexOf(location.pathname)
  const showFastTrackStepper = fastTrackStepIndex !== -1

  const smsStepIdx = CIRCLE_INVITE_SMS_STEPS.indexOf(location.pathname)
  const voiceStepIdx = CIRCLE_INVITE_VOICE_STEPS.indexOf(location.pathname)
  const circleInviteStepIndex = smsStepIdx !== -1 ? smsStepIdx : voiceStepIdx
  const showCircleInviteStepper = circleInviteStepIndex !== -1

  return (
    <header className="sticky top-0 z-10 flex w-full flex-col border-b bg-white/80 backdrop-blur-md dark:bg-neutral-950/80">
      <div className="flex w-full items-center justify-between p-2">
        <div className="flex items-center gap-2">
          {!isRoot && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onBack || (() => navigate(-1))}
              aria-label="Go back"
            >
              {backIcon || <ChevronLeft size={24} />}
            </Button>
          )}
          {title && <p className="text-base font-medium">{title}</p>}
        </div>
        {rightAction}
        {showHelp && (
          <Button
            variant="outline"
            className="rounded-full border-neutral-300 font-normal text-neutral-600 hover:bg-neutral-50"
            size="sm"
            onClick={() => navigate("/patients/payment/request-payment/help")}
          >
            Need help?
          </Button>
        )}
      </div>
      {showLoanApplicationStepper && (
        <div className="w-full px-4 pb-2">
          <Stepper
            currentStep={currentStepIndex + 1}
            totalSteps={LOAN_APPLICATION_STEPS.length}
          />
        </div>
      )}
      {showCareProfileStepper && (
        <div className="w-full px-4 pb-2">
          <Stepper
            currentStep={careProfileStepIndex + 1}
            totalSteps={CARE_PROFILE_STEPS.length}
            completedSteps={careProfileCompletedSteps}
          />
        </div>
      )}
      {showKycStepper && (
        <div className="w-full px-4 pb-2">
          <Stepper
            currentStep={kycStepIndex + 1}
            totalSteps={KYC_STEPS.length}
            completedSteps={kycCompletedSteps}
          />
        </div>
      )}
      {showOnboardingStepper && (
        <div className="w-full px-4 pb-2">
          <Stepper
            currentStep={onboardingStepIndex + 1}
            totalSteps={ONBOARDING_STEPS.length}
            completedSteps={onboardingCompletedSteps}
          />
        </div>
      )}
      {showPwaStepper && (
        <div className="w-full px-4 pb-2">
          <Stepper
            currentStep={pwaStepIndex + 1}
            totalSteps={PWA_STEPS.length}
            completedSteps={pwaCompletedSteps}
          />
        </div>
      )}
      {showFastTrackStepper && (
        <div className="w-full px-4 pb-2">
          <Stepper
            currentStep={fastTrackStepIndex + 1}
            totalSteps={FAST_TRACK_STEPS.length}
          />
        </div>
      )}
      {showCircleInviteStepper && (
        <div className="w-full px-4 pb-2">
          <Stepper currentStep={circleInviteStepIndex + 1} totalSteps={4} />
        </div>
      )}
    </header>
  )
}
