import { Navigate, Route, Routes } from "react-router-dom"
import RouteMetadata from "@/components/RouteMetadata"
import ResolveProvider from "./ResolveProvider"
import PaymentDetails from "./PaymentDetails"
import FastTrackWalletSelection from "./FastTrackWalletSelection"
import ConfirmPayment from "./ConfirmPayment"
import FastTrackPaymentStatus from "./PaymentStatus"
import FastTrackStepGuard from "./FastTrackStepGuard"

export default function FastTrackWrapper() {
  return (
    <FastTrackStepGuard>
      <Routes>
        <Route
          index
          element={<Navigate to="/patients/fast-track/resolve-provider" replace />}
        />
        <Route
          path="/resolve-provider"
          element={
            <RouteMetadata title="Enter Payment Number">
              <ResolveProvider />
            </RouteMetadata>
          }
        />
        <Route
          path="/payment-details"
          element={
            <RouteMetadata title="Payment Details">
              <PaymentDetails />
            </RouteMetadata>
          }
        />
        <Route
          path="/wallet-selection"
          element={
            <RouteMetadata title="Choose How to Pay">
              <FastTrackWalletSelection />
            </RouteMetadata>
          }
        />
        <Route
          path="/confirm"
          element={
            <RouteMetadata title="Confirm Payment">
              <ConfirmPayment />
            </RouteMetadata>
          }
        />
        <Route
          path="/status"
          element={
            <RouteMetadata title="Payment Status">
              <FastTrackPaymentStatus />
            </RouteMetadata>
          }
        />
      </Routes>
    </FastTrackStepGuard>
  )
}
