import { Route, Routes } from "react-router-dom"
import PatientSignUp from "./Pages/Onboarding/PatientSignUp"
import PatientsHome from "./Pages/PatientsHome"
import RouteMetadata from "@/components/RouteMetadata"
import useSetAmplitudeUserId from "@/hooks/useSetAmplitudeUserId"
import useTenantAccessControl from "@/hooks/useTenantAccessControl"
import { PatientOTP } from "./Pages/Onboarding/PatientOTP"
import PatientValidateReferral from "./Pages/PatientValidateReferral"
import PatientAcceptInvite from "./Pages/Network/PatientAcceptInvite"

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
            <RouteMetadata title="Sign Up">
              <PatientSignUp />
            </RouteMetadata>
          }
        />
        <Route
          path="/auth/otp"
          element={
            <RouteMetadata title="OTP Verification">
              <PatientOTP />
            </RouteMetadata>
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
