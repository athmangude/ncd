import { useQuery } from "@tanstack/react-query"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { supabase } from "@/lib/supabase"

export const patientLoginDetailsQueryKey = "patientLoginDetails"

export function useOnboardingChecklist() {
  const setUser = usePatientAuthStore((state: any) => state.setUser)

  return useQuery({
    queryKey: [patientLoginDetailsQueryKey],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .single()
      if (error) throw error

      const { data: wallet } = await supabase
        .from("wallets")
        .select("cashback_balance")
        .single()

      const userDetails = {
        id: profile.id,
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        phoneNumber: profile.phone,
        email: "",
        isVerified: true,
        hasVerifiedId: "APPROVED",
        membershipStatus: "ACTIVE",
        hasActiveMembership: true,
        creditLimit: {
          totalCreditLimitAmount: "0",
          remainingAmount: "0",
          currency: { countryName: "Kenya", code: "KES", id: 1 },
        },
        medicalRequests: [],
        loans: [],
        wallets: [
          {
            id: "wallet-mpesa",
            type: "MPESA",
            remainingBalance: "0",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "wallet-cashback",
            type: "CASHBACK",
            remainingBalance: String(wallet?.cashback_balance ?? 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "wallet-loan",
            type: "LOAN",
            remainingBalance: "0",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        patientCircle: null,
        hasAcceptedMedicalConsentForm: true,
        hasAcceptedLatestTermsAndConditions: true,
        hasBeenReferred: false,
        hasVerifiedCrbScore: false,
        idVerificationStatus: "APPROVED",
        network: [],
        type: "PUBLIC",
        canPayMedicalBill: true,
        orgBorrower: null,
        hasUploadedMpesaStatement: false,
        careFundAccount: {
          id: 1,
          careFundBalance: String(wallet?.cashback_balance ?? 0),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accountOwner: null,
          currency: { countryName: "Kenya", code: "KES", id: 1 },
        },
        accountReference: "",
        subscriptions: [],
        isBasicMember: false,
        hasSetPin: true,
        profilePhoto: null,
        onboardingRedirectLink: "",
      }

      setUser(userDetails)
      return userDetails
    },
  })
}

export async function checkPwaIsIntalled() {
  //check local storage to see if user has skipped installation
  if (localStorage.getItem("pwaInstallSkipped") === "true") return true

  // Check display mode
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
  if (isStandalone) return true

  // Check localStorage flag
  if (localStorage.getItem("pwaInstalled") === "true") return true

  // Check installed related apps (if supported)
  if ("getInstalledRelatedApps" in window) {
    const relatedApps = await (window as any).getInstalledRelatedApps()
    return relatedApps.some((app: any) => app.id === "your-pwa-id")
  }

  return false
}
