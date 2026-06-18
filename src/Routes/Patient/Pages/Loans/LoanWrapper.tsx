import RouteMetadata from "@/components/RouteMetadata"
import { Route, Routes } from "react-router-dom"
import ViewLoanDetails from "./PatientViewLoanDetails"
import InvoiceDetails from "./PatientInvoiceDetails"
import LoanCreationSuccess from "./LoanCreationSuccess"
import PatientAllLoans from "./PatientAllLoans"

export default function LoanWrapper() {
  return (
    <Routes>
      {/* Loan details */}
      <Route
        path="/loan-details/:id"
        element={
          <RouteMetadata title="Loan Details">
            <ViewLoanDetails />
          </RouteMetadata>
        }
      />
      <Route path="/invoice-details/:id" element={<InvoiceDetails />} />

      <Route
        path="/loan-application-success"
        element={
          <RouteMetadata title="Loan Application Success">
            <LoanCreationSuccess />
          </RouteMetadata>
        }
      />

      <Route
        path="/all-loans"
        element={
          <RouteMetadata title="All Loans">
            <PatientAllLoans />
          </RouteMetadata>
        }
      />
    </Routes>
  )
}
