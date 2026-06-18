import { usePatientAuthStore } from "../stores/patientAuthStore"
import { MEMBER_LOAN_ROLES } from "../constants/userTypes"

export default function useReferralChecklist() {
  const user = usePatientAuthStore((state: any) => state.user) || {}

  if (
    !user.hasBeenReferred &&
    MEMBER_LOAN_ROLES.includes(user.type)
  ) {
    return "/patients/referral-code"
  }

  return null
}

