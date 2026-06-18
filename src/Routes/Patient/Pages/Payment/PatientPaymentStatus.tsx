import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { CheckCircle2, AlertCircle, Clock, Coins, Receipt } from "lucide-react"

import PatientPageWrapper from "../PatientPageWrapper"
import QueryWrapper from "@/components/QueryBlock"
import { Button } from "@/components/Button"
import { getFromLocalStorage } from "@/utilities/localStorage"
import { formatMoney } from "@/utilities/currencyUtilities"
import { formatDateLong, formatTime } from "@/utilities/dateUtilities"
import Title from "@/components/typography/Title"
import successIcon from "@/assets/icons/success-icon.png"
import landline from "@/assets/icons/landline.png"

// Types based on the provided JSON
interface PaymentStatusResponse {
  message?: string
  id?: string
  currency?: {
    id: number
    countryName: string
    code: string
  }
  paymentSplits?: {
    id: string
    paymentSplitAmount: string
    status: string
    wallet: {
      id: string
      type: string
    }
    loan: any
    paymentTransaction: {
      id: string
      amount: string
      status: string
    } | null
    createdAt: string
    updatedAt: string
  }[]
  patientMedicalInfoRequest?: {
    id: string
    patientName: string
    medicalInvoiceFile: {
      id: string
      filePath: string
      url: string
    }
    facility: {
      id: number
      name: string
      isOutOfNetwork: boolean
    }
  }
  facility?: {
    id: number
    name: string
    isOutOfNetwork?: boolean
  }
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
  }
  totalBillAmount?: string
  transactionAmount?: string // Fallback
  careProviderDisbursalAmount?: string
  careProviderCommissionPercentage?: string
  disbursementTransaction?: {
    id: string
    amount: string
    status: string
  }
  status?: string
  createdAt?: string
  updatedAt?: string
  transactionDateTime?: string // Fallback
  cashbackDetails?: {
    source: string
    amount: string
  }[]
}

export const patientPaymentStatusQueryKey = "patientPaymentStatus"

export default function PatientPaymentStatus() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // 2. Retrieve the paymentId from localStorage or URL params.
  const reference = searchParams.get("trxref") || searchParams.get("reference")
  const paymentId = searchParams.get("paymentId") || getFromLocalStorage("paymentId")

  const query = useQuery({
    queryKey: [patientPaymentStatusQueryKey, paymentId, reference],
    queryFn: async () => {
      if (!paymentId && !reference) throw new Error("No payment ID or reference found")
      
      let url = ""
      if (reference) {
        url = `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/payments/transaction-result/${reference}`
        // 4. GET /payments/user/payment-details?paymentId={paymentId}
      } else {
        url = `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/payments/user/payment-details?paymentId=${paymentId}`
      }

      const response = await axios.get(url)
      return response.data as PaymentStatusResponse
    },
    enabled: !!paymentId || !!reference,
  })

  // Redirect if no payment ID or reference
  useEffect(() => {
    if (!paymentId && !reference) {
       // Optional: Redirect to dashboard if no payment ID found in local storage
       // navigate("/patients")
    }
  }, [paymentId, reference, navigate])

  return (
    <PatientPageWrapper title="Transaction Result">
      <QueryWrapper isLoading={query.isLoading} error={query.error}>
        {query.data ? (
            <PaymentStatusContent data={query.data} reference={reference} />
        ) : (
             !query.isLoading && !paymentId && !reference && (
                <div className="flex flex-col items-center justify-center h-full gap-4 mt-10 px-4 text-center">
                    <AlertCircle className="w-12 h-12 text-neutral-400" />
                    <p className="text-neutral-600">No payment information found.</p>
                    <Button onClick={() => navigate("/patients")}>Go to Dashboard</Button>
                </div>
            )
        )}
      </QueryWrapper>
    </PatientPageWrapper>
  )
}

function PaymentStatusContent({ data, reference }: { data: PaymentStatusResponse; reference: string | null }) {
  const navigate = useNavigate()
  
  const statusConfig = useMemo(() => {
    switch (data.status) {
      case "COMPLETED":
      case "success": // Handle both potential status values
        return {
          icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        }
      case "FAILED":
      case "failed":
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-500" />,
          title: "Payment Failed",
          description: "There was an issue processing your payment.",
        }
      default:
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: "Payment Processing",
          description: "Your payment is currently being processed.",
        }
    }
  }, [data.status])

  const amount = Number(data.totalBillAmount || data.transactionAmount || 0)
  const date = data.createdAt || data.updatedAt || data.transactionDateTime || new Date().toISOString()
  const facilityName = data.patientMedicalInfoRequest?.facility?.name || data.facility?.name|| "Care Provider"
  const isSuccess = data.status === "success" || data.status === "COMPLETED"

  return (
    <>
      <div className="flex flex-col gap-6 text-center items-center mt-10 px-4">

      {isSuccess ? (
            <div className="relative">
              <img
                  src={successIcon}
                  alt="Invoice"
                  className="w-16 h-16 object-contain"
                />
         </div>
      ) : (
        <img
        src={landline}
        alt="Landline"
        className="w-16 h-16 object-contain"
      />
      )}
      <Title >{statusConfig.title}</Title>

      {isSuccess ? (
        <p className="text-neutral-600 ">
          <span className="font-medium text-neutral-700">{formatMoney(amount, "KES")}  </span> has been paid to <span className="capitalize">{facilityName}</span> on
          <span className="font-medium text-neutral-700">  {formatDateLong(date)} at {formatTime(date)}</span>
        </p>
      ) : (
        <p className="text-neutral-600 ">{statusConfig.description}</p>
      )}

      {isSuccess && data.paymentSplits && data.paymentSplits.length > 0 && (
        <div>
            {data.paymentSplits.map((split) => {
              const earnedAmount = Number(split.paymentSplitAmount) * 0.05;
              if (split.wallet?.type !== "MPESA" || earnedAmount <= 0) return null;
              return (
                <div key={split.id} className="flex justify-center ">
                  <Coins className="text-neutral-500" />
                  <p className="text-neutral-600 capitalize">
                    You have earned {formatMoney(earnedAmount, "KES")} for paying with Jireh Health at {facilityName.toLowerCase()}
                  </p>
                </div>
              );
            })}
          </div>
      )}


     {isSuccess && data.paymentSplits && data.paymentSplits.length > 0 && !data.patientMedicalInfoRequest?.facility?.isOutOfNetwork && (
        <div>
            {data.paymentSplits.map((split) =>
              (split.wallet?.type === "LOAN" && !data.patientMedicalInfoRequest?.facility?.isOutOfNetwork  ? (
                <div className="w-full bg-[#FAF5FF] border border-[#A855F7] rounded-xl p-4 flex items-center gap-3 text-left mt-2">
                <div className="flex-shrink-0 relative">
                    <img src={successIcon} alt="Reward" className="w-12 h-12 object-contain" />
                </div>
                <p className="font-medium text-sm text-neutral-900">
                    Earn {formatMoney(Number(split.paymentSplitAmount) * 0.05,  "KES")} when you repay loan before the due date!
                </p>
            </div>
              ) : null
            ))}
          </div>
      )}
      
      
        <Button
          onClick={() => navigate(`/patients/payments/payment-details/${reference ?? data.id}`)}
          className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800"
          size="lg"
        >
          <Receipt className="w-4 h-4 m-1" />
          View receipt
        </Button>

      <Button
        className="w-full"
        size="lg"
        onClick={() => navigate("/patients")}
      >
        Back to Dashboard
      </Button>
      </div>
    </>
  )
}
