import { create } from "zustand"
import Session from "supertokens-web-js/recipe/session"
import { CountryCode } from "libphonenumber-js"
import { clearAllParticipantState } from "@/mocks/domain/reset"
import { supabase, useSupabase } from "@/lib/supabase"
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
export const usePatientAuthStore = create<PatientAuthState>((set, get) => ({
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
    if (!useSupabase) return

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
    if (useSupabase) {
      await supabase.auth.signOut()
      set(() => ({
        user: null,
        signUpDetails: null,
        supabaseSession: null,
        isAuthenticated: false,
      }))
      return
    }

    await Session.signOut()

    // Sign out is the single path back to a fresh, unseeded participant. Wipe
    // every trace of this participant — mock collections, session + returning-user
    // flags, app-flow keys, the discovery tab cache and the offline IndexedDB — so
    // the next load starts logged-out at the phone-number entry. (Reloading without
    // signing out preserves everything; only this clears state.)
    try {
      clearAllParticipantState()
    } catch {
      // Best-effort cleanup; don't block logout on failure
    }

    set(() => ({ user: null, signUpDetails: null }))
  },
}))
