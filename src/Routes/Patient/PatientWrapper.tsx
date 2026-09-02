import { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import Session from "supertokens-web-js/recipe/session"
import PatientSignUp from "./Pages/Onboarding/PatientSignUp"
import PatientsHome from "./Pages/PatientsHome"
import RouteMetadata from "@/components/RouteMetadata"
import useSetAmplitudeUserId from "@/hooks/useSetAmplitudeUserId"
import useTenantAccessControl from "@/hooks/useTenantAccessControl"
import { PatientOTP } from "./Pages/Onboarding/PatientOTP"
import PatientValidateReferral from "./Pages/PatientValidateReferral"
import PatientAcceptInvite from "./Pages/Network/PatientAcceptInvite"
import { useSupabase } from "@/lib/supabase"
import { usePatientAuthStore } from "./stores/patientAuthStore"
import { lazy, Suspense } from "react"

const PhoneEntryPage = lazy(() => import("./Pages/Auth/PhoneEntryPage"))
const OtpVerifyPage = lazy(() => import("./Pages/Auth/OtpVerifyPage"))

function RedirectIfSessionExists({ children }: { children: React.ReactNode }) {
  const [sessionExists, setSessionExists] = useState<boolean | null>(null)

  useEffect(() => {
    Session.doesSessionExist().then(setSessionExists)
  }, [])

  if (sessionExists === null) {
    return null
  }
  if (sessionExists) {
    return <Navigate to="/patients/" replace />
  }
  return <>{children}</>
}

function RedirectIfSupabaseSession({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = usePatientAuthStore((s) => s.isAuthenticated)
  const initializeAuth = usePatientAuthStore((s) => s.initializeAuth)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    initializeAuth().then(() => setInitialized(true))
  }, [initializeAuth])

  if (!initialized) return null
  if (isAuthenticated) return <Navigate to="/patients/" replace />
  return <>{children}</>
}

export default function PatientWrapper() {
  useTenantAccessControl({
    setTenantIdValue: "patients",
  })
  useSetAmplitudeUserId()

  return (
    <main className="">
      <Routes>
        {useSupabase ? (
          <>
            <Route
              path="/auth"
              element={
                <RedirectIfSupabaseSession>
                  <RouteMetadata title="Sign In">
                    <Suspense fallback={null}>
                      <PhoneEntryPage />
                    </Suspense>
                  </RouteMetadata>
                </RedirectIfSupabaseSession>
              }
            />
            <Route
              path="/auth/otp"
              element={
                <RedirectIfSupabaseSession>
                  <RouteMetadata title="OTP Verification">
                    <Suspense fallback={null}>
                      <OtpVerifyPage />
                    </Suspense>
                  </RouteMetadata>
                </RedirectIfSupabaseSession>
              }
            />
          </>
        ) : (
          <>
            <Route
              path="/auth"
              element={
                <RedirectIfSessionExists>
                  <RouteMetadata title="Sign Up">
                    <PatientSignUp />
                  </RouteMetadata>
                </RedirectIfSessionExists>
              }
            />
            <Route
              path="/auth/otp"
              element={
                <RedirectIfSessionExists>
                  <RouteMetadata title="OTP Verification">
                    <PatientOTP />
                  </RouteMetadata>
                </RedirectIfSessionExists>
              }
            />
          </>
        )}

        <Route
          path="/validate-referral"
          element={
            <RouteMetadata title="Validate Referral">
              <PatientValidateReferral />
            </RouteMetadata>
          }
        />

        <Route
          path="/network/accept-invite"
          element={
            <RouteMetadata title="Accept Invite">
              <PatientAcceptInvite />
            </RouteMetadata>
          }
        />

        <Route
          path="/*"
          element={
            <RouteMetadata title="Patient">
              <PatientsHome />
            </RouteMetadata>
          }
        />
      </Routes>
    </main>
  )
}
