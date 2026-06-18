import RouteMetadata from "@/components/RouteMetadata"
import { Route, Routes } from "react-router-dom"
import PatientCareFundPage from "./PatientCareFund"
import PatientGiftRecipient from "./PatientGiftRecipient"
import PatientCareFundSuccess from "./PatientCareFundSuccess"
import PatientCareFundSavings from "./PatientCareFundSavings"

export default function PatientCareFundRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteMetadata title="Your Care Fund">
            <PatientCareFundPage />
          </RouteMetadata>
        }
      />

      <Route
        path="/gift-recipient"
        element={
          <RouteMetadata title="Gift Recipient">
            <PatientGiftRecipient />
          </RouteMetadata>
        }
      />
      <Route
        path="/savings"
        element={
          <RouteMetadata title="Save">
            <PatientCareFundSavings />
          </RouteMetadata>
        }
      />

      <Route
        path="/success"
        element={
          <RouteMetadata title="Success">
            <PatientCareFundSuccess />
          </RouteMetadata>
        }
      />
    </Routes>
  )
}
