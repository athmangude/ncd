import { useLocation } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { MEMBER_LOAN_ROLES } from "../constants/userTypes"

export const PUBLIC_MEMBERSHIP_SETUP_START_URL = "/patients/choose-healthcare-plan"
export const ORG_MEMBERSHIP_SETUP_START_URL = "/patients/organizations/how-it-works"

export const publicMembershipSetupRoutes = new Map<string, string>([
  ["/patients/onboarding-success", "/patients/choose-healthcare-plan"],
  ["/patients/choose-healthcare-plan", "/patients/plans-how-it-works"],
  ["/patients/plans-how-it-works", "/patients/financial-statements"], 
  ["/patients/financial-statements", "/patients/review-membership-details"],
  ["/patients/review-membership-details", "/patients/membership-success"],
  ["/patients/membership-success", "/patients/"],
])

export const orgMembershipSetupRoutes = new Map<string, string>([

  ["/patients/org-onboarding-success", "/patients/choose-healthcare-plan"],
  ["/patients/choose-healthcare-plan", "/patients/plans-how-it-works"],
  ["/patients/plans-how-it-works", "/patients/financial-statements"], 
  ["/patients/financial-statements", "/patients/review-membership-details"],
  ["/patients/review-membership-details", "/patients/membership-success"],
  ["/patients/membership-success", "/patients/"],
])

export default function useNextMembershipSetupStep() {
  const location = useLocation()
  const user = usePatientAuthStore((state: any) => state.user) || {}

  const patientType = user.type

  if (patientType === "ORG") {
    return orgMembershipSetupRoutes.get(location.pathname) || "/patients/"
  } else if (MEMBER_LOAN_ROLES.includes(patientType)) {
    return publicMembershipSetupRoutes.get(location.pathname) || "/patients/"
  }
  return "/patients/"
}
