import { useLocation } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import IncompleteSignUp from "../components/IncompleteSignUp"
import { isIdVerified } from "../enums/PatientIdVerificationStatus"
import { useOnboardingChecklist } from "../hooks/useOnboardingChecklist"
import LoadingPage from "@/Routes/LoadingPage"

export default function CompleteProfilePage() {
  const location = useLocation()
  const user = usePatientAuthStore((state: any) => state.user)
  const query = useOnboardingChecklist()
  
  // Prefer state from navigation, fallback to query data
  let onboardingRedirectLink = 
    location.state?.onboardingRedirectLink || 
    query.data?.onboardingRedirectLink || 
    ""

  if (!onboardingRedirectLink && !isIdVerified(user?.idVerificationStatus)) {
    onboardingRedirectLink = "/patients/id-verification-onboarding"
  }
    
  const fromPayMedicalBill = location.state?.fromPayMedicalBill || false

  if (query.isLoading) {
    return <LoadingPage />
  }

  return (
    <IncompleteSignUp 
      onboardingRedirectLink={onboardingRedirectLink} 
      user={user} 
      fromPayMedicalBill={fromPayMedicalBill} 
      isCompletingProfile={true}
    />
  )
}
