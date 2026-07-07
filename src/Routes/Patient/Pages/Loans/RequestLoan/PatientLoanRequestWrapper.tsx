import { Route, Routes } from "react-router-dom"
import PatientTreatmentDetails from "./PatientTreatmentDetails"
import RouteMetadata from "@/components/RouteMetadata"
import PatientSelectPatient from "./PatientSelectPatient"
import PatientUploadInvoice from "./PatientUploadInvoice"
import PatientSetBillAmount from "./PatientSetBillAmount"
import PatientHowToPay from "./PatientHowToPay"
import PatientInvoiceGuide from "./PatientInvoiceGuide"

import PatientReviewInvoice from "./PatientReviewInvoice"
import PatientPaymentConfirmation from "./PatientPaymentConfirmation"
import PatientLoanTerms from "./PatientLoanTerms"
import PatientWalletSelection from "./PatientWalletSelection"
import PatientVerificationPending from "./PatientVerificationPending"
import ProtectedLoanStep from "./ProtectedLoanStep"
import HelpAndSupport from "../../Faqs/HelpAndSupport"
import InvoiceDetailsMismatchGuide from "../../Faqs/InvoiceDetailsMismatchGuide"
import InvoiceValidityGuide from "../../Faqs/InvoiceValidityGuide"

export default function PatientLoanRequestWrapper() {
  return (
    <Routes>
      <Route
        path="/help"
        element={
          <RouteMetadata title="Help & Support">
            <HelpAndSupport />
          </RouteMetadata>
        }
      />
      <Route
        path="/help/invoice-details-mismatch"
        element={
          <RouteMetadata title="Invoice Details Don't Match">
            <InvoiceDetailsMismatchGuide />
          </RouteMetadata>
        }
      />
      <Route
        path="/help/invoice-validity"
        element={
          <RouteMetadata title="Invoice Not Valid">
            <InvoiceValidityGuide />
          </RouteMetadata>
        }
      />
      <Route
        path="/how-to-pay"
        element={
          <RouteMetadata title="How to pay">
            <PatientHowToPay />
          </RouteMetadata>
        }
      />

      <Route
        path="/review-invoice"
        element={
          <RouteMetadata title="Review Invoice">
            <PatientReviewInvoice />
          </RouteMetadata>
        }
      />

      <Route
        path="/invoice-guide"
        element={
          <RouteMetadata title="Taking a good invoice photo">
            <PatientInvoiceGuide />
          </RouteMetadata>
        }
      />

      <Route
        path="/upload-invoice"
        element={
          <RouteMetadata title="Upload Invoice">
            <PatientUploadInvoice />
          </RouteMetadata>
        }
      />

      <Route
        path="/select-patient"
        element={
          <RouteMetadata title="Select Patient">
            <PatientSelectPatient />
          </RouteMetadata>
        }
      />

      <Route
        path="/treatment-details"
        element={
          <RouteMetadata title="Treatment Details">
            <PatientTreatmentDetails />
          </RouteMetadata>
        }
      />

      <Route
        path="/set-bill-amount"
        element={
          <RouteMetadata title="Set Bill Amount">
            <PatientSetBillAmount />
          </RouteMetadata>
        }
      />
      <Route
        path="/verification-pending"
        element={
          <RouteMetadata title="Verification Pending">
            <PatientVerificationPending />
          </RouteMetadata>
        }
      />

      <Route
        path="/wallet-selection"
        element={
          <RouteMetadata title="Choose Payment Method">
            <ProtectedLoanStep>
              <PatientWalletSelection />
            </ProtectedLoanStep>
          </RouteMetadata>
        }
      />

      <Route
        path="/payment-confirmation"
        element={
          <RouteMetadata title="Confirm Payment">
            <ProtectedLoanStep>
              <PatientPaymentConfirmation />
            </ProtectedLoanStep>
          </RouteMetadata>
        }
      />

      <Route
        path="/loan-terms"
        element={
          <RouteMetadata title="Loan Terms">
            <ProtectedLoanStep>
              <PatientLoanTerms />
            </ProtectedLoanStep>
          </RouteMetadata>
        }
      />
    </Routes>
  )
}
