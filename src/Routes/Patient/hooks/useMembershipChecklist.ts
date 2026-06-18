import { usePatientAuthStore } from "../stores/patientAuthStore"

export default function useMembershipChecklist() {
  const user = usePatientAuthStore((state: any) => state.user) || {}

  if (!user.canPayMedicalBill) {
    if (
      user.membershipStatus === "BLOCKED" ||
      user.membershipStatus === "LOCKED"
    ) {
      return ""
    }
    return "/patients/choose-healthcare-plan"
  }

  return null
}

