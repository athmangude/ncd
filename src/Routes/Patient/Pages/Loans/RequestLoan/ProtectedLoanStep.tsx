import { Navigate } from "react-router-dom"
import { getFromLocalStorage } from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"

export default function ProtectedLoanStep({ children }: { children: React.ReactNode }) {
  const data = getFromLocalStorage(patientReviewInvoiceStorageKey)
  const manualRequestId = getFromLocalStorage("manualPaymentRequestId")
  const status = data?.status

  if (!data && manualRequestId) {
    return <Navigate to="/patients/payment/request-payment/verification-pending" replace />
  }

  if (!data) {
    // If no data exists, redirect to start of flow
    return <Navigate to="/patients/payment/request-payment/upload-invoice" replace />
  }

  if (status === "PENDING") {
    return <Navigate to="/patients/payment/request-payment/verification-pending" replace />
  }

  if (status === "REJECTED") {
    return <Navigate to="/patients/payment/request-payment/verification-pending" replace />
  }

  if (status === "APPROVED") {
    return <>{children}</>
  }
  
  return <Navigate to="/patients/payment/request-payment/review-invoice" replace />
}
