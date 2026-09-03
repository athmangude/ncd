import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useNavigate, useSearchParams } from "react-router-dom"
import { formatMoney } from "@/utilities/currencyUtilities"
import { CircleAlert, Coins, Receipt } from "lucide-react"
import { formatDateLong, formatTime } from "@/utilities/dateUtilities"
import { Button } from "@/components/Button"
import QueryWrapper from "@/components/QueryBlock"
import PatientPageWrapper from "../PatientPageWrapper"
import successIcon from "@/assets/icons/success-icon.png"
import Title from "@/components/typography/Title"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"
import { safeAmount } from "@/analytics/metadata"

export const patientTransactionResultQueryKey = "patientTransactionResult"

export default function TransactionResult() {
  const [params] = useSearchParams()

  // Get reference from either URL params or state
  const reference = params.get("trxref") || params.get("reference")
  const paymentId = params.get("paymentId")

  const query = useQuery({
    queryKey: [patientTransactionResultQueryKey],
    queryFn: async () => {
      const identifier = paymentId ?? reference

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", identifier as string)
        .single()

      if (error) throw error

      return {
        id: data.id,
        status: data.status,
        totalBillAmount: data.amount,
        updatedAt: data.created_at,
        disbursementTransaction: data.disbursement_transaction,
        paymentSplits: data.payment_splits,
        description: data.description,
        facilityName: data.facility_name,
        facilityType: data.facility_type,
        cashbackAmount: data.cashback_amount,
        cashbackDetails: data.cashback_details,
        patientMedicalInfoRequest: data.patient_medical_info_request,
        currency: { code: data.currency ?? "KES" },
      }
    },
  })

  return (
    <QueryWrapper isLoading={query.isLoading} error={query.error}>
      <PatientPageWrapper title="Transaction Result">
        <div className="flex flex-col gap-6 text-center items-center mt-10 px-4">
          <TransactionResultScreen query={query} />
        </div>
      </PatientPageWrapper>
    </QueryWrapper>
  )
}

function TransactionResultScreen({ query }: { query: any }) {
  const {
    status,
    totalBillAmount,
    updatedAt,
    disbursementTransaction,
    paymentSplits,
    // New fields
    transactionAmount,
    transactionDateTime,
    description,
    careFundPotentialAmount,
    isLoanRepayment,
    loanId,
  } = query.data || {}

  const navigate = useNavigate()

  useEffect(() => {
    if (!query.data) return
    try {
      trackEvent(EVENTS.LOAN_REPAYMENT.RESULT_VIEW, {
        status,
        isLoanRepayment,
        amount: safeAmount(totalBillAmount ?? transactionAmount),
      })
    } catch {
      // Silent fail
    }
    // Fire-once-on-data-arrive; re-firing on amount/status churn would inflate the result-view event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])

  const { title } = resolvePaymentText(status)

  // Normalize data for display
  const displayAmount = totalBillAmount ?? transactionAmount
  const displayDate = updatedAt ?? transactionDateTime
  const displayDescription = disbursementTransaction?.description ?? description

  return (
    <>
      {status === "success" || status === "COMPLETED" ? (
        <div className="relative">
          <img
            src={successIcon}
            alt="Invoice"
            className="w-16 h-16 object-contain"
          />
        </div>
      ) : (
        <CircleAlert size={80} className=" mx-auto text-orange-500" />
      )}
      <Title>{title}</Title>

      {(status === "success" || status === "COMPLETED") && (
        <p className="text-muted-foreground capitalize">
          {formatMoney(displayAmount, "KES")}{" "}
          {displayDescription?.toLowerCase()} on
          <span className="font-medium text-foreground">
            {" "}
            {formatDateLong(displayDate)} at {formatTime(displayDate)}
          </span>
        </p>
      )}
      {isLoanRepayment && (
        <div className=" flex  text-center ">
          <Coins className="text-muted-foreground" />
          <p className="text-muted-foreground capitalize">
            You have earned
            <span className="font-medium text-foreground">
              {" "}
              {formatMoney(displayAmount * 0.05, "KES")}
            </span>{" "}
            cashback for paying with Jireh
          </p>
        </div>
      )}

      {/* Only show EarnCareFundCTA if we have loan data  and facility is In Network*/}
      {(status === "success" || status === "COMPLETED") &&
        !isLoanRepayment &&
        (() => {
          let calculatedPotentialAmount = 0

          if (
            careFundPotentialAmount !== undefined &&
            careFundPotentialAmount !== null
          ) {
            calculatedPotentialAmount = Number(careFundPotentialAmount)
          } else {
            const loanSplits =
              paymentSplits?.filter(
                (split: any) => split.wallet?.type === "LOAN"
              ) || []
            if (loanSplits.length > 0) {
              const totalLoanAmount = loanSplits.reduce(
                (acc: number, split: any) =>
                  acc + Number(split.paymentSplitAmount),
                0
              )
              calculatedPotentialAmount = totalLoanAmount * 0.05
            }
          }

          if (calculatedPotentialAmount <= 0) return null

          return (
            <div className="w-full bg-secondary border border-primary rounded-xl p-4 flex items-center gap-3 text-left mt-2">
              <div className="flex-shrink-0 relative">
                <img
                  src={successIcon}
                  alt="Reward"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <p className="font-medium text-sm text-foreground">
                Earn {formatMoney(calculatedPotentialAmount, "KES")} when you
                repay before the due date!
              </p>
            </div>
          )
        })()}
      {!isLoanRepayment && (
        <Button
          onClick={() =>
            navigate(`/patients/payments/payment-details/${query.data?.id}`)
          }
          className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800"
          size="lg"
        >
          <Receipt className="w-4 h-4 m-1" />
          View receipt
        </Button>
      )}

      {isLoanRepayment && loanId && (
        <Button
          onClick={() => navigate(`/patients/loans/loan-details/${loanId}`)}
          className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800"
          size="lg"
        >
          <Receipt className="w-4 h-4 m-1" />
          View loan
        </Button>
      )}

      <Button
        role="link"
        onClick={() => navigate(`/patients/`)}
        className="w-full "
        size="lg"
      >
        Back to dashboard
      </Button>
    </>
  )
}

function resolvePaymentText(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":
      return {
        title: "Payment Pending",
        description:
          "Your payment is pending. We will notify you once it is completed",
      }
    case "success":
    case "completed":
      return {
        title: "Payment successful!",
        description:
          "Your payment has been successful. You will receive a confirmation SMS shortly",
      }
    case "failed":
      return {
        title: "Payment Failed",
        description:
          "Your payment has failed. Please try again or contact support",
      }
    case "reversed":
      return {
        title: "Payment Reversed",
        description:
          "Your payment has been reversed. Please try again or contact support",
      }
    default:
      return {
        title: "Payment Status Unknown",
        description: "Your payment status is unknown. Please contact support",
      }
  }
}
