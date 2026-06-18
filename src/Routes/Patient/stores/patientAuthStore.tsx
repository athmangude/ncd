import { create } from "zustand"
import Session from "supertokens-web-js/recipe/session"
import { CountryCode } from "libphonenumber-js"

interface SignUpDetails {
  phoneNumber: string
  countryCode: CountryCode
  firstName: string
  lastName: string
  whatsappNumber?: string
  whatsappCountryCode?: CountryCode
  userId?: string
  amplitudeToken?: string
  loginTime?: Date
}

export interface PatientAuthState {
  user: any | null // Replace `any` with a specific type if available
  signUpDetails: SignUpDetails | null
  setSignUpDetails: (details: SignUpDetails) => void
  setUserId: (userId: string, amplitudeToken: string, loginTime: Date) => void
  setUser: (user: any) => void // Replace `any` with a specific type if available
  signOut: () => Promise<void>
}
export const usePatientAuthStore = create<PatientAuthState>((set) => ({
  user: null,
  signUpDetails: null,
  setSignUpDetails: ({
    phoneNumber,
    countryCode,
    firstName,
    lastName,
    whatsappNumber,
    whatsappCountryCode,
  }: SignUpDetails) =>
    set((state: any) => {
      const newState = {
        ...state.user,
        phoneNumber,
        countryCode,
        firstName,
        lastName,
        whatsappNumber,
        whatsappCountryCode,
      }
      return {
        signUpDetails: newState,
      }
    }),
  setUserId: (userId: string, amplitudeToken: string, loginTime: Date) =>
    set((state: any) => {
      const newState = {
        ...state.signUpDetails,
        userId,
        amplitudeToken,
        loginTime,
      }

      return {
        signUpDetails: newState,
      }
    }),
  setUser: (user: any) =>
    set(() => {
      return { user }
    }),
  signOut: async () => {
    await Session.signOut()

    // Clear all patient-specific client state when logging out
    try {
      if (typeof window !== "undefined") {
        const patientLocalStorageKeys = [
          // Auth / onboarding
          "approved_patient_phone_number",
          // Loan request flow
          "patientReviewInvoice",
          "manualPaymentRequestId",
          "paymentId",
          "paymentResponse",
          "patientSelectPatient",
          "patientTreatmentDetails",
          // KYC circle members
          "kyc_circle_members",
        ]

        patientLocalStorageKeys.forEach((key) => {
          try {
            window.localStorage.removeItem(key)
          } catch {
            // ignore
          }
        })

        // Clear discovery tab state persisted in sessionStorage
        try {
          window.sessionStorage.removeItem("discovery_tab_state")
        } catch {
          // ignore
        }

        // Clear offline IndexedDB cache used by useOfflinePatientData
        try {
          window.indexedDB?.deleteDatabase("JirehHealthDB")
        } catch {
          // ignore
        }
      }
    } catch {
      // Best-effort cleanup; don't block logout on failure
    }

    set(() => ({ user: null, signUpDetails: null }))
  },
}))
