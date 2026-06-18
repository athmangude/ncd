import { useLocation, matchPath } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { isIdVerified } from "../enums/PatientIdVerificationStatus"

export interface OnboardingStep {
  id: string
  label: string
  route: string
  checkCompletion: (user: any) => boolean
}

export const ONBOARDING_STEP_CONFIG: OnboardingStep[] = [
  {
    id: "otp",
    label: "OTP Verification",
    route: "/patients/auth/otp",
    checkCompletion: (user) => !!user
  },
  {
    id: "personal-details",
    label: "Personal Details",
    route: "/patients/personal-details",
    checkCompletion: (user) => !!(user?.firstName && user?.lastName)
  },
  {
    id: "set-pin",
    label: "Set PIN",
    route: "/patients/set-pin",
    checkCompletion: (user) => !!user?.hasSetPin
  },
  {
    id: "id-verification",
    label: "ID Verification",
    route: "/patients/id-verification-onboarding",
    checkCompletion: (user) => isIdVerified(user?.idVerificationStatus)
  }
]

export const ONBOARDING_STEPS = ONBOARDING_STEP_CONFIG.map(step => step.route)

export const getFirstIncompleteStep = (user: any): string | null => {
  const firstIncomplete = ONBOARDING_STEP_CONFIG.find(step => !step.checkCompletion(user))
  return firstIncomplete ? firstIncomplete.route : null
}

export default function useNextOnboardingStep() {
  const location = useLocation()
  const user = usePatientAuthStore((state: any) => state.user)

  // Special handling for OTP page (Invite logic)
  if (location.pathname === "/patients/auth/otp") {
    const inviteId = localStorage.getItem("inviteId")
    if (inviteId) {
      return "/patients/network/accept-invite"
    }

    const referrerId = localStorage.getItem("referrerId")
    if (referrerId) {
      return "/patients/network/accept-share-link"
    }
  }

  const currentStepIndex = ONBOARDING_STEP_CONFIG.findIndex(step =>
    matchPath({ path: step.route, end: true }, location.pathname)
  )

  if (currentStepIndex !== -1) {
    // We are on a step. Find the NEXT incomplete step.
    for (let i = currentStepIndex + 1; i < ONBOARDING_STEP_CONFIG.length; i++) {
      if (!ONBOARDING_STEP_CONFIG[i].checkCompletion(user)) {
        return ONBOARDING_STEP_CONFIG[i].route
      }
    }
    // If all subsequent steps are complete, go to success
    return "/patients/onboarding-success"
  }

  // If not on a known step (entry point or other pages), route to first incomplete step
  // or default to home if all complete.
  return getFirstIncompleteStep(user) || "/patients"
}
