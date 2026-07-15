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

/**
 * Guards the auth entry routes so a returning user with a live session —
 * e.g. reloading after an error boundary, or restarting the app mid-session
 * — lands back on the dashboard instead of being sent through sign-up again.
 * Onboarding-incomplete redirects are handled downstream by
 * useOnboardingChecklist once inside PatientsHome. Mirrors the session check
 * Home.tsx already does for "/".
 */
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

export default function PatientWrapper() {
  useTenantAccessControl({
    setTenantIdValue: "patients",
  })
  useSetAmplitudeUserId()

  return (
    <main className="">
      <Routes>
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
