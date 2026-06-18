import RouteMetadata from "@/components/RouteMetadata"
import { Route, Routes } from "react-router-dom"
import PatientViewPaymentDetails from "./PatientViewPaymentDetails"
import PatientPaymentHistory from "./PatientPaymentHistory"
import PatientPaymentBreakdown from "./PatientPaymentBreakdown"

export default function PaymentWrapper() {
  return (
    <Routes>
      <Route 
        path="/"
        element={
            <RouteMetadata title="Payment History">
                <PatientPaymentHistory />
            </RouteMetadata>
        }
      />
      {/* Payment details */}
      <Route
        path="/payment-details/:id"
        element={
          <RouteMetadata title="Payment Details">
            <PatientViewPaymentDetails />
          </RouteMetadata>
        }
      />
      {/* How you paid */}
      <Route
        path="/how-you-paid/:id"
        element={
          <RouteMetadata title="How you paid">
            <PatientPaymentBreakdown />
          </RouteMetadata>
        }
      />
    </Routes>
  )
}
