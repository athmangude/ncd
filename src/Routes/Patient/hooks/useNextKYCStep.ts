import { useLocation, matchPath } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { PatientDocumentVerificationStatus, isIdVerified } from "../enums/PatientIdVerificationStatus"

export const KYC_START_URL = "/patients/kyc-setup-intro"

// Define the shape of a KYC Step
export interface KYCStep {
  id: string
  label: string
  route: string
  checkCompletion: (user: any) => boolean
  description?: string
}

// Define the steps configuration
export const KYC_STEP_CONFIG: KYCStep[] = [
  {
    id: "01",
    label: "National ID number",
    route: "/patients/id-verification",
    checkCompletion: (u) => isIdVerified(u?.idVerificationStatus)
  },
  {
    id: "02",
    label: "Identity Verification",
    route: "/patients/document-verification",
    checkCompletion: (u) => u?.documentVerificationStatus === PatientDocumentVerificationStatus.PASSED
  },
  {
    id: "03",
    label: "Add 2 people to your Circle",
    route: "/patients/kyc-add-circle-members",
    checkCompletion: (u) => {
      // Check both network and invites, filter for adults only
      const network = u?.network || []
      const invites = u?.invites || []
      const allMembers = [...network, ...invites]
      const adultMembers = allMembers.filter(
        (member: any) => member.relationship !== "CHILD" && member.status !== "PENDING"
      )
      return adultMembers.length >= 2
    }
  },
  {
    id: "04",
    label: "Pay KES 499",
    description: "One-time-fee",
    route: "/patients/pay-membership",
    checkCompletion: (u) => !!u?.hasActiveMembership
  }
]

// Export simple array of routes for compatibility with existing code (e.g. PatientPageWrapper)
export const KYC_STEPS = KYC_STEP_CONFIG.map(step => step.route)

// Helper to get steps for a specific user (in case logic depends on user, though currently static)
export const getKYCSteps = (_user: any): KYCStep[] => KYC_STEP_CONFIG

// Determine the first incomplete step
export const getFirstIncompleteStep = (user: any): string | null => {
  const steps = getKYCSteps(user)
  const firstIncomplete = steps.find(step => !step.checkCompletion(user))
  return firstIncomplete ? firstIncomplete.route : null
}

/**
 * Checks if KYC verification is required
 * Returns true if any step is incomplete
 */
export function requiresKYCVerification(user: any): boolean {
  if (!user) return true
  // Check if any step is incomplete
  return getKYCSteps(user).some(step => !step.checkCompletion(user))
}

/**
 * Returns the KYC intro URL if verification is required, otherwise returns null
 * Use this function in payment flows to check if KYC is needed before proceeding
 */
export function getKYCRedirectUrl(user: any): string | null {
  if (requiresKYCVerification(user)) {
    return KYC_START_URL
  }
  return null
}

/**
 * Hook to get the next KYC step based on current location and user status.
 * Intelligently skips completed steps.
 */
export default function useNextKYCStep() {
  const location = useLocation()
  const user = usePatientAuthStore((state: any) => state.user)
  const steps = getKYCSteps(user)

  // Check if we are currently on the intro page
  const isIntroPage = location.pathname === KYC_START_URL

  if (isIntroPage) {
     // If on intro page, next step is the first incomplete one
     // If all complete, return dashboard
     return getFirstIncompleteStep(user) || location.state?.returnUrl || "/patients"
  }

  // Check if we are currently on one of the KYC steps
  const currentStepIndex = steps.findIndex(step => 
    matchPath({ path: step.route, end: true }, location.pathname)
  )

  if (currentStepIndex !== -1) {
    // We are on a step. Find the NEXT incomplete step.
    // Iterate from currentStepIndex + 1 to find the first incomplete step
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
        if (!steps[i].checkCompletion(user)) {
            return steps[i].route
        }
    }
    // If no subsequent incomplete steps, we are done.
    return location.state?.returnUrl || "/patients"
  }

  // Not in KYC flow (e.g. separate entry point). 
  // If KYC is required, return intro.
  const kycRedirectUrl = getKYCRedirectUrl(user)
  if (kycRedirectUrl) {
    return kycRedirectUrl
  }
  
  // If KYC is complete and not in KYC flow, return undefined (no redirect needed)
  return undefined
}
