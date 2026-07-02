import { useLocation } from "react-router-dom"
import { LOAN_APPLICATION_STEPS } from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import {
  CARE_PROFILE_STEPS,
  getCareProfileSteps,
} from "@/Routes/Patient/hooks/useNextCareProfileStep"
import {
  KYC_STEPS,
  KYC_STEP_CONFIG,
  getKYCSteps,
} from "@/Routes/Patient/hooks/useNextKYCStep"
import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_CONFIG,
} from "@/Routes/Patient/hooks/useNextOnboardingStep"
import { CARE_PROFILE_STEP_CONFIG } from "@/Routes/Patient/hooks/useNextCareProfileStep"
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

export interface JourneyStepperState {
  currentStep: number
  totalSteps: number
  completedSteps?: boolean[]
}

/**
 * Detect which of the seven onboarding/payment journeys the current route
 * belongs to and return the progress-stepper state for it, or `null` when the
 * route is not part of any journey.
 *
 * The detection is keyed off `location.pathname` + the auth store, exactly as it
 * used to live inside `StepperHeader`. It is extracted here so the stepper can be
 * rendered either in the pinned app bar (legacy) or in a content-level
 * `PageHeader`, without duplicating the route logic. Precedence is preserved:
 * loan → care profile → KYC → onboarding → PWA → fast track → circle invite.
 */
export function useJourneyStepper(): JourneyStepperState | null {
  const location = useLocation()
  const user =
    usePatientAuthStore((state: PatientAuthState) => state.user) || {}

  // PWA status is a hook, so it must be called unconditionally on every render.
  const { stepStatus: pwaStatus } = usePWAOnboardingStatus()

  const loanIndex = LOAN_APPLICATION_STEPS.indexOf(location.pathname)
  if (loanIndex !== -1) {
    return {
      currentStep: loanIndex + 1,
      totalSteps: LOAN_APPLICATION_STEPS.length,
    }
  }

  const careProfileIndex = CARE_PROFILE_STEPS.indexOf(location.pathname)
  if (careProfileIndex !== -1) {
    return {
      currentStep: careProfileIndex + 1,
      totalSteps: CARE_PROFILE_STEPS.length,
      completedSteps: getCareProfileSteps(user).map((step) =>
        step.checkCompletion(user)
      ),
    }
  }

  const kycIndex = KYC_STEPS.indexOf(location.pathname)
  if (kycIndex !== -1) {
    return {
      currentStep: kycIndex + 1,
      totalSteps: KYC_STEPS.length,
      completedSteps: getKYCSteps(user).map((step) =>
        step.checkCompletion(user)
      ),
    }
  }

  const onboardingIndex = ONBOARDING_STEPS.indexOf(location.pathname)
  if (onboardingIndex !== -1) {
    return {
      currentStep: onboardingIndex + 1,
      totalSteps: ONBOARDING_STEPS.length,
      completedSteps: ONBOARDING_STEP_CONFIG.map((step) =>
        step.checkCompletion(user)
      ),
    }
  }

  const pwaIndex = PWA_STEPS.indexOf(location.pathname)
  if (pwaIndex !== -1) {
    return {
      currentStep: pwaIndex + 1,
      totalSteps: PWA_STEPS.length,
      completedSteps: PWA_STEP_CONFIG.map((step) => pwaStatus[step.id]),
    }
  }

  const fastTrackIndex = FAST_TRACK_STEPS.indexOf(location.pathname)
  if (fastTrackIndex !== -1) {
    return {
      currentStep: fastTrackIndex + 1,
      totalSteps: FAST_TRACK_STEPS.length,
    }
  }

  const smsStepIdx = CIRCLE_INVITE_SMS_STEPS.indexOf(location.pathname)
  const voiceStepIdx = CIRCLE_INVITE_VOICE_STEPS.indexOf(location.pathname)
  const circleInviteIndex = smsStepIdx !== -1 ? smsStepIdx : voiceStepIdx
  if (circleInviteIndex !== -1) {
    return {
      currentStep: circleInviteIndex + 1,
      totalSteps: 4,
    }
  }

  return null
}

export interface JourneyStepMeta {
  title?: string
  description?: string
}

// Config-backed journeys whose steps carry a per-step `label` (and sometimes a
// `description`). Loan / fast-track / circle-invite steps are plain route
// arrays with no labels, so they contribute nothing here.
const STEP_META_CONFIGS: {
  route: string
  label: string
  description?: string
}[] = [
  ...ONBOARDING_STEP_CONFIG,
  ...KYC_STEP_CONFIG,
  ...CARE_PROFILE_STEP_CONFIG,
  ...PWA_STEP_CONFIG,
]

/**
 * The current route's step label/description from its journey config, used as a
 * fallback when a screen doesn't pass explicit title/description. Returns `{}`
 * for routes not backed by a labelled step config. Note: these labels are terse
 * system names ("Personal Details"), so most screens should still pass explicit,
 * friendly copy — this is a safety net, not the primary source.
 */
export function useJourneyStepMeta(): JourneyStepMeta {
  const location = useLocation()
  const match = STEP_META_CONFIGS.find(
    (step) => step.route === location.pathname
  )
  if (!match) return {}
  return { title: match.label, description: match.description }
}
