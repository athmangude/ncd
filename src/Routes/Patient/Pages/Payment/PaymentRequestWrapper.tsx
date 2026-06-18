import RouteMetadata from "@/components/RouteMetadata"
import { Route, Routes } from "react-router-dom"
import PatientLoanRequestWrapper from "../Loans/RequestLoan/PatientLoanRequestWrapper"
import LoanCreationSuccess from "../Loans/LoanCreationSuccess"

export default function PaymentRequestWrapper() {
  return (
    <Routes>
      {/* Request payment flow */}
      <Route
        path="/request-payment/*"
        element={
          <RouteMetadata title="Request Payment">
            <PatientLoanRequestWrapper />
          </RouteMetadata>
        }
      />

      <Route
        path="/request-payment/loan-creation-success/:id"
        element={
          <RouteMetadata title="Loan Creation Success">
            <LoanCreationSuccess />
          </RouteMetadata>
        }
      />
    </Routes>
  )
}
