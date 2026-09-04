import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface PatientLoginDetails {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  isVerified: boolean
  hasVerifiedId: string
  membershipStatus: string
  hasActiveMembership: boolean
  creditLimit: {
    totalCreditLimitAmount: string
    remainingAmount: string
    currency: {
      countryName: string
      code: string
      id: number
    }
  }
  medicalRequests: Array<any>
  loans: Array<any>
  hasAcceptedMedicalConsentForm: boolean
  hasAcceptedLatestTermsAndConditions: boolean
  hasBeenReferred: boolean
  hasVerifiedCrbScore: boolean
  idVerificationStatus: string
  documentVerificationStatus: string
  network: Array<any>
  type: string
  canPayMedicalBill: boolean
  orgBorrower: any
  hasUploadedMpesaStatement: boolean
  careFundAccount: {
    id: number
    careFundBalance: string
    createdAt: string
    updatedAt: string
    accountOwner: any
    currency: {
      countryName: string
      code: string
      id: number
    }
  }
  accountReference: string
  subscriptions: Array<any>
  message?: string
  isBasicMember?: boolean
  hasSetPin: boolean
  profilePhoto?: string | null
  wallets: Array<{
    id: string
    type: string
    remainingBalance: string
    createdAt: string
    updatedAt: string
  }>
  patientCircle?: {
    id: string
    status: string
    maxAccountableSlots: number
    maxAuxiliarySlots: number
    filledAccountableSlots: number
    filledAuxiliarySlots: number
    isFrozen: boolean
    hasCompletedSetup: boolean
    activatedAt: string
    createdAt: string
    updatedAt: string
  }
  gender?: string
  dateOfBirth?: string
}

export function usePatientLoginDetails() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const query = useQuery({
    queryKey: ["patientLoginDetails"],
    queryFn: async () => {
      const { data: pd, error: pdError } = await supabase
        .from("patient_details")
        .select("data")
        .maybeSingle()

      if (pdError && pdError.code !== "PGRST116") throw pdError

      const { data: wallet } = await supabase
        .from("wallets")
        .select("cashback_balance")
        .maybeSingle()

      const blob = (pd?.data ?? {}) as Record<string, any>
      const cashbackBalance = wallet?.cashback_balance ?? 0
      const creditLimit = blob.creditLimit ?? {
        totalCreditLimitAmount: "0",
        remainingAmount: "0",
        currency: { countryName: "Kenya", code: "KES", id: 1 },
      }

      const baseWallets = Array.isArray(blob.wallets) ? blob.wallets : []
      const walletsWithLiveBalances = baseWallets.map(
        (w: { id: string; type: string; createdAt: string; updatedAt: string }) => {
          if (["CASHBACK", "WALLET", "CARE_SAVER"].includes(w.type)) {
            return { ...w, remainingBalance: String(cashbackBalance) }
          }
          if (w.type === "LOAN") {
            return {
              ...w,
              remainingBalance: creditLimit.remainingAmount ?? "0",
            }
          }
          return w
        },
      )

      return {
        id: blob.id ?? "",
        firstName: blob.firstName ?? "",
        lastName: blob.lastName ?? "",
        email: blob.email ?? "",
        phoneNumber: blob.phoneNumber ?? "",
        isVerified: blob.isVerified ?? false,
        hasVerifiedId: blob.hasVerifiedId ?? "PENDING",
        membershipStatus: blob.membershipStatus ?? "NONE",
        hasActiveMembership: blob.hasActiveMembership ?? false,
        creditLimit,
        medicalRequests: blob.medicalRequests ?? [],
        loans: blob.loans ?? [],
        hasAcceptedMedicalConsentForm:
          blob.hasAcceptedMedicalConsentForm ?? false,
        hasAcceptedLatestTermsAndConditions:
          blob.hasAcceptedLatestTermsAndConditions ?? false,
        hasBeenReferred: blob.hasBeenReferred ?? false,
        hasVerifiedCrbScore: blob.hasVerifiedCrbScore ?? false,
        idVerificationStatus: blob.idVerificationStatus ?? "PENDING",
        documentVerificationStatus:
          blob.documentVerificationStatus ?? "PENDING",
        network: blob.network ?? [],
        type: blob.type ?? "PUBLIC",
        canPayMedicalBill: blob.canPayMedicalBill ?? false,
        orgBorrower: blob.orgBorrower ?? null,
        hasUploadedMpesaStatement: blob.hasUploadedMpesaStatement ?? false,
        careFundAccount: blob.careFundAccount ?? {
          id: 1,
          careFundBalance: String(cashbackBalance),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accountOwner: null,
          currency: { countryName: "Kenya", code: "KES", id: 1 },
        },
        accountReference: blob.accountReference ?? "",
        subscriptions: blob.subscriptions ?? [],
        isBasicMember: blob.isBasicMember ?? true,
        hasSetPin: blob.hasSetPin ?? false,
        profilePhoto: blob.profilePhoto ?? null,
        wallets: walletsWithLiveBalances,
        patientCircle: blob.patientCircle ?? undefined,
        gender: blob.gender ?? undefined,
        dateOfBirth: blob.dateOfBirth ?? undefined,
      } as PatientLoginDetails
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !isOffline,
  })

  return {
    data: query.data as PatientLoginDetails | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isOffline,
    refetch: query.refetch,
  }
}
