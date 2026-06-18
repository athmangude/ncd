import { Button } from "@/components/Button"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { LOAN_APPLICATION_STEPS } from "../hooks/useNextLoanApplicationStep"
import { CARE_PROFILE_STEPS, getCareProfileSteps } from "../hooks/useNextCareProfileStep"
import { KYC_STEPS, getKYCSteps } from "../hooks/useNextKYCStep"
import { ONBOARDING_STEPS, ONBOARDING_STEP_CONFIG } from "../hooks/useNextOnboardingStep"
import { PWA_STEPS, PWA_STEP_CONFIG, usePWAOnboardingStatus } from "../hooks/useNextPWAOnboardingStep"
import { FAST_TRACK_STEPS } from "../hooks/useNextFastTrackStep"
import {
  CIRCLE_INVITE_SMS_STEPS,
  CIRCLE_INVITE_VOICE_STEPS,
} from "../hooks/useNextCircleInviteStep"
import { Stepper } from "@/components/Stepper"
import { usePatientAuthStore } from "../stores/patientAuthStore"

export default function PatientPageWrapper({
  children,
  title,
  isRoot = false,
  className,
  showHelp = false,
  onBack,
  backIcon,
  rightAction,
}: {
  children: React.ReactNode
  title?: string // Made optional as sometimes we might not want a title or it's empty
  isRoot?: boolean
  className?: string
  showHelp?: boolean
  onBack?: () => void
  backIcon?: React.ReactNode
  rightAction?: React.ReactNode
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = usePatientAuthStore((state: any) => state.user) || {}

  const currentStepIndex = LOAN_APPLICATION_STEPS.indexOf(location.pathname)
  const showLoanApplicationStepper = currentStepIndex !== -1

  const careProfileStepIndex = CARE_PROFILE_STEPS.indexOf(location.pathname)
  const showCareProfileStepper = careProfileStepIndex !== -1

  const careProfileCompletedSteps = showCareProfileStepper 
    ? getCareProfileSteps(user).map(step => step.checkCompletion(user))
    : undefined

  const kycStepIndex = KYC_STEPS.indexOf(location.pathname)
  const showKycStepper = kycStepIndex !== -1
  
  const kycCompletedSteps = showKycStepper 
    ? getKYCSteps(user).map(step => step.checkCompletion(user))
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
    ? PWA_STEP_CONFIG.map(step => pwaStatus[step.id])
    : undefined

  const fastTrackStepIndex = FAST_TRACK_STEPS.indexOf(location.pathname)
  const showFastTrackStepper = fastTrackStepIndex !== -1

  const smsStepIdx = CIRCLE_INVITE_SMS_STEPS.indexOf(location.pathname)
  const voiceStepIdx = CIRCLE_INVITE_VOICE_STEPS.indexOf(location.pathname)
  const circleInviteStepIndex = smsStepIdx !== -1 ? smsStepIdx : voiceStepIdx
  const showCircleInviteStepper = circleInviteStepIndex !== -1

  return (
    <>
      <header className="sticky top-0 z-50 flex w-full flex-col bg-white">
        <div className="flex w-full items-center justify-between ">
          <div className="flex items-center gap-2">
            {!isRoot && (
              <button 
              onClick={onBack || (() => navigate(-1))} 
              className="bg-white p-2 rounded-lg border border-neutral-100 shadow-sm"
          >
              {backIcon || <ArrowLeft className="w-6 h-6 text-neutral-600" />}
          </button>
            )}
            {title && <h1 className="text-md capitalize ">{title}</h1>}
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
          <div className="w-full py-1 px-4">
            <Stepper
              currentStep={currentStepIndex + 1}
              totalSteps={LOAN_APPLICATION_STEPS.length}
            />
          </div>
        )}
        {showCareProfileStepper && (
          <div className="w-full py-1 px-4">
            <Stepper
              currentStep={careProfileStepIndex + 1}
              totalSteps={CARE_PROFILE_STEPS.length}
              completedSteps={careProfileCompletedSteps}
            />
          </div>
        )}
        {showKycStepper && (
          <div className="w-full py-1 px-4">
            <Stepper
              currentStep={kycStepIndex + 1}
              totalSteps={KYC_STEPS.length}
              completedSteps={kycCompletedSteps}
            />
          </div>
        )}
        {showOnboardingStepper && (
          <div className="w-full py-1 px-4">
            <Stepper
              currentStep={onboardingStepIndex + 1}
              totalSteps={ONBOARDING_STEPS.length}
              completedSteps={onboardingCompletedSteps}
            />
          </div>
        )}
        {showPwaStepper && (
          <div className="w-full py-1 px-4">
            <Stepper
              currentStep={pwaStepIndex + 1}
              totalSteps={PWA_STEPS.length}
              completedSteps={pwaCompletedSteps}
            />
          </div>
        )}
        {showFastTrackStepper && (
          <div className="w-full py-1 px-4">
            <Stepper
              currentStep={fastTrackStepIndex + 1}
              totalSteps={FAST_TRACK_STEPS.length}
            />
          </div>
        )}
        {showCircleInviteStepper && (
          <div className="w-full py-1 px-4">
            <Stepper
              currentStep={circleInviteStepIndex + 1}
              totalSteps={4}
            />
          </div>
        )}
      </header>

      <section className={cn("flex flex-col w-full gap-5", className)}>
        {children}
      </section>
    </>
  )
}
