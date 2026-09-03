import { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import PatientsHome from "./Pages/PatientsHome"
import RouteMetadata from "@/components/RouteMetadata"
import useSetAmplitudeUserId from "@/hooks/useSetAmplitudeUserId"
import useTenantAccessControl from "@/hooks/useTenantAccessControl"
import PatientValidateReferral from "./Pages/PatientValidateReferral"
import PatientAcceptInvite from "./Pages/Network/PatientAcceptInvite"
import { usePatientAuthStore } from "./stores/patientAuthStore"
import { lazy, Suspense } from "react"

const PhoneEntryPage = lazy(() => import("./Pages/Auth/PhoneEntryPage"))
const PinVerifyPage = lazy(() => import("./Pages/Auth/PinVerifyPage"))

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
          path="/auth/pin"
          element={
            <RedirectIfSupabaseSession>
              <RouteMetadata title="PIN Verification">
                <Suspense fallback={null}>
                  <PinVerifyPage />
                </Suspense>
              </RouteMetadata>
            </RedirectIfSupabaseSession>
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
