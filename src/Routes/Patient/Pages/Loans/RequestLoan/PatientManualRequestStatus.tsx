import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useQuery } from "@tanstack/react-query"
import { setToLocalStorage } from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
import Loader from "@/components/Loader"
import PatientPageWrapper from "../../PatientPageWrapper"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/Button"

export default function PatientManualRequestStatus() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ["manual-request", id],
    queryFn: async () => {
      if (!id) throw new Error("No request ID provided")
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/payments/manual-review-request/${id}`
      )
      return response.data
    },
    enabled: !!id,
    retry: false,
  })

  useEffect(() => {
    if (data) {
      if (data.payment && data.payment.paymentSplits && data.payment.paymentSplits.length > 0) {
        return
      }

      setToLocalStorage(patientReviewInvoiceStorageKey, data)

      if (data.status === "APPROVED") {
         navigate("/patients/payment/request-payment/wallet-selection", {
           replace: true,
           state: {
             careProvider: data.kmpdcFacility,
             patient: data.dependent || data.patient,
             totalBillAmount: data.billAmount,

           }
         })
      } else {
         navigate("/patients/payment/request-payment/verification-pending", { replace: true })
      } 
    }
  }, [data, navigate])

  if (isLoading) {
    return (
      <PatientPageWrapper title="Checking Status">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader className="w-12 h-12 text-primary" />
          <p className="mt-4 text-muted-foreground">Retrieving request details...</p>
        </div>
      </PatientPageWrapper>
    )
  }

  if (data && data.payment && data.payment.paymentSplits && data.payment.paymentSplits.length > 0) {
    return (
      <PatientPageWrapper title="Payment Status">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-foreground mb-2">
            Payment Already Made
          </h1>
          <p className="text-muted-foreground">
            This payment request has already been paid.
          </p>
          <Button
            onClick={() => navigate("/patients")}
            className="w-full mt-5"
          >
            Go Home
          </Button>
        </div>
      </PatientPageWrapper>
    )
  }

  if (error || (data && data.status === "REJECTED")) {
     return (
       <PatientPageWrapper title="Request Status">
         <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">✕</span>
            </div>
            <h1 className="text-foreground mb-2">
              {data?.status === "REJECTED" ? "Request Rejected" : "Error"}
            </h1>
            <p className="text-muted-foreground">
              {data?.status === "REJECTED"
                ? "Your payment request was rejected. Please contact support for more details."
                : "Could not retrieve request details. Please try again or contact support."}
            </p>
             <button
                onClick={() => navigate("/patients")}
                className="mt-8 px-6 py-3 bg-foreground text-white rounded-xl font-semibold"
             >
               Go Home
             </button>
         </div>
       </PatientPageWrapper>
     )
  }

  return null // Should redirect
}

