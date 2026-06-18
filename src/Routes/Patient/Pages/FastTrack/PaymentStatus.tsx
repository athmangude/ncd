import { useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { Button } from "@/components/Button"
import { formatMoney } from "@/utilities/currencyUtilities"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import { useFastTrackStore } from "./useFastTrackStore"
import { CircleAlert, Clock, Receipt } from "lucide-react"
import successIcon from "@/assets/icons/success-icon.png"
import Title from "@/components/typography/Title"
import { formatDateLong, formatTime } from "@/utilities/dateUtilities"

export default function FastTrackPaymentStatus() {
  const navigate = useNavigate()
  const transaction = useFastTrackStore((s) => s.transaction)
  const paymentSubmitted = useFastTrackStore((s) => s.paymentSubmitted)
  const setPaymentSubmitted = useFastTrackStore((s) => s.setPaymentSubmitted)
  const reset = useFastTrackStore((s) => s.reset)

  const handleBackToDashboard = useCallback(() => {
    reset()
    navigate("/patients", { replace: true })
  }, [reset, navigate])

  useEffect(() => {
    if (transaction && !paymentSubmitted) {
      setPaymentSubmitted(true)
    }
  }, [transaction, paymentSubmitted, setPaymentSubmitted])

  useEffect(() => {
    if (!transaction) return
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.RESULT_VIEW, {
      payment_id: transaction.id,
      payment_status: transaction.status,
      amount_paid: safeAmount(
        transaction.totalBillAmount ?? transaction.grossAmount
      ),
      currency: "KES",
      provider_name: transaction.providerName,
    })
  }, [transaction])

  useEffect(() => {
    if (!transaction) return

    const pushState = () => {
      window.history.pushState({ fastTrackStatus: true }, "")
    }

    pushState()

    const handlePopState = () => {
      pushState()
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [transaction])

  if (!transaction) {
    return (
      <PatientPageWrapper title="Payment Status" onBack={handleBackToDashboard}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
          <Clock className="w-12 h-12 text-neutral-400" />
          <p className="text-neutral-600">No transaction information found.</p>
          <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
        </div>
      </PatientPageWrapper>
    )
  }

  const totalBillAmount = Number(
    transaction.totalBillAmount ?? transaction.grossAmount ?? 0
  )
  const isHolding = transaction.status === "HOLDING"
  const isSuccess =
    isHolding ||
    transaction.status === "SETTLED" ||
    transaction.status === "DISBURSED"
  const providerName = transaction.providerName
  // The recorded PaymentRecord is keyed by `transaction.id` (not the display
  // `transactionId`), so the receipt lookup must use `id` to resolve.
  const transactionId = transaction.id
  const displayDate = transaction.createdAt

  return (
    <PatientPageWrapper
      title="Transaction Result"
      onBack={handleBackToDashboard}
    >
      <div className="flex flex-col gap-6 text-center items-center mt-10 px-4">
        {isSuccess ? (
          <div className="relative">
            <img
              src={successIcon}
              alt="Success"
              className="w-16 h-16 object-contain"
            />
          </div>
        ) : (
          <CircleAlert size={80} className="mx-auto text-orange-500" />
        )}

        <Title>{isSuccess ? "Payment Successful" : "Payment Processing"}</Title>

        {isSuccess && (
          <p className="text-neutral-600 capitalize">
            {formatMoney(totalBillAmount, "KES")} paid to{" "}
            {providerName || "the provider"} on
            <span className="font-medium text-black">
              {" "}
              {formatDateLong(displayDate)} at {formatTime(displayDate)}
            </span>
          </p>
        )}

        <Button
          onClick={() =>
            navigate(`/patients/payments/payment-details/${transactionId}`)
          }
          className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800 mt-4"
          size="lg"
        >
          <Receipt className="w-4 h-4 m-1" />
          View receipt
        </Button>

        <Button
          role="link"
          onClick={handleBackToDashboard}
          className="w-full"
          size="lg"
        >
          Back to dashboard
        </Button>
      </div>
    </PatientPageWrapper>
  )
}
