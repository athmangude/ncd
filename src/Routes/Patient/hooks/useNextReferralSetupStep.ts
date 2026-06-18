import { useLocation } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { MEMBER_LOAN_ROLES } from "../constants/userTypes"

const publicRoutes = {
  "/patients/referral-code": "/patients/onboarding-success",
}

export default function useNextReferralSetupStep() {
  const location = useLocation()
  const user = usePatientAuthStore((state: any) => state.user) || {}
  const patientType = user.type

  if (MEMBER_LOAN_ROLES.includes(patientType)) {
    return publicRoutes[location.pathname as keyof typeof publicRoutes]
  }

  return null
}

