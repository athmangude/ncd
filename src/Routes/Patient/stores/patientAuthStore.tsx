import { create } from "zustand"
import { CountryCode } from "libphonenumber-js"
import { clearAllParticipantState } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase"
import type { Session as SupabaseSession } from "@supabase/supabase-js"

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
  supabaseSession: SupabaseSession | null
  isAuthenticated: boolean
  setSignUpDetails: (details: SignUpDetails) => void
  setUserId: (userId: string, amplitudeToken: string, loginTime: Date) => void
  setUser: (user: any) => void // Replace `any` with a specific type if available
  setSupabaseSession: (session: SupabaseSession | null) => void
  initializeAuth: () => Promise<void>
  signOut: () => Promise<void>
}
export const usePatientAuthStore = create<PatientAuthState>((set) => ({
  user: null,
  signUpDetails: null,
  supabaseSession: null,
  isAuthenticated: false,
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
  setSupabaseSession: (session: SupabaseSession | null) =>
    set(() => ({
      supabaseSession: session,
      isAuthenticated: session !== null,
    })),
  initializeAuth: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      set({ supabaseSession: data.session, isAuthenticated: true })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        supabaseSession: session,
        isAuthenticated: session !== null,
      })
    })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    clearAllParticipantState()
    set(() => ({
      user: null,
      signUpDetails: null,
      supabaseSession: null,
      isAuthenticated: false,
    }))
  },
}))
