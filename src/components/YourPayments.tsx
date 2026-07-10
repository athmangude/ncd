import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import PatientDashboardSection from "@/Routes/Patient/components/PatientDashboardSection"
import { TransactionHistoryList } from "@/components/TransactionHistoryList"
import {
  HistoryCard,
  HistoryEntry,
  AmountTime,
  HistoryChevron,
  CashbackEarnedEntry,
  LoanEntry,
} from "@/components/HistoryCard"
import { useNavigate } from "react-router-dom"
import { formatDateLong } from "@/utilities/dateUtilities"
import { useMemo } from "react"

export default function YourPayments() {
  const { data: paymentHistory } = usePaymentHistory()
  const payments = useMemo(
    () => paymentHistory?.payments || [],
    [paymentHistory?.payments]
  )

  return (
    <PatientDashboardSection title="Your Payments">
      <TransactionHistoryList
        items={payments}
        getKey={(payment: any) => payment.id}
        getDate={(payment: any) => payment.createdAt}
        renderItem={(payment: any) => <PaymentCard payment={payment} />}
      />
    </PatientDashboardSection>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function resolvePaymentStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-success-solid"
    case "PENDING":
      return "bg-warning-solid"
    case "FAILED":
      return "bg-destructive"
    case "PROCESSING":
      return "bg-info-solid"
    default:
      return "bg-muted-foreground"
  }
}

export function PaymentCard({
  payment,
  navigationState,
}: {
  payment: any
  /**
   * Optional state passed to navigate() when the card is tapped. Lets the
   * payment details page reconstruct where the user came from so its back
   * button can return to the right origin instead of always falling back
   * to the dashboard.
   */
  navigationState?: unknown
}) {
  const navigate = useNavigate()

  const {
    id: paymentId,
    totalBillAmount,
    createdAt,
    currency,
    patientMedicalInfoRequest,
    disbursementTransaction,
    paymentSplits,
    cashbackDetails,
  } = payment

  const currencyCode = currency?.code || "KES"

  // Facility Name Logic
  // Try to get from patientMedicalInfoRequest.facility.name
  // Fallback to disbursementTransaction.description (cleaned up)
  // Fallback to generic text
  let facilityName = "Healthcare Provider"
  if (patientMedicalInfoRequest?.facility?.name) {
    facilityName = patientMedicalInfoRequest.facility.name
  } else if (disbursementTransaction?.description) {
    facilityName = disbursementTransaction.description
  }

  const title =
    (facilityName ?? "").startsWith("Paid at") ||
    (facilityName ?? "").startsWith("Payment at")
      ? (facilityName ?? "")
      : `Paid at ${(facilityName ?? "").toLocaleLowerCase()}`

  const goToDetails = () =>
    navigate(`/patients/payments/payment-details/${paymentId}`, {
      state: navigationState,
    })

  // Loan Logic
  // Find a split that has a loan
  const loanSplit = paymentSplits?.find((split: any) => split.loan)
  const loan = loanSplit?.loan
  const hasLoan = !!loan
  const dueDate = loan?.loanDueDate
  const outstandingAmount = loan?.outstandingAmount

  const daysRemaining = dueDate
    ? Math.ceil(
        (new Date(dueDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  const formattedDueDate = dueDate
    ? formatDateLong(dueDate).split(" ").slice(0, 2).join(" ")
    : ""

  // Cashback Logic
  const totalCashback =
    cashbackDetails?.reduce(
      (sum: number, detail: any) => sum + Number(detail.amount),
      0
    ) || 0
  const hasCashback = totalCashback > 0

  return (
    <HistoryCard onClick={goToDetails}>
      {/* Header row — payment provider + amount·time. No leading icon. */}
      <HistoryEntry
        title={title}
        subtitle={
          <AmountTime
            amount={Number(totalBillAmount)}
            currency={currencyCode}
            createdAt={createdAt}
          />
        }
        trailing={<HistoryChevron />}
      />

      {/* Cashback sub-entry (only when this payment earned cashback). */}
      {hasCashback && (
        <CashbackEarnedEntry amount={totalCashback} currency={currencyCode} />
      )}

      {/* Loan sub-entry (only when this payment carries a loan). */}
      {hasLoan && (
        <LoanEntry
          outstandingAmount={outstandingAmount}
          amount={loan.totalPaid}
          currency={currencyCode}
          dueDate={dueDate}
          formattedDueDate={formattedDueDate}
          daysRemaining={daysRemaining}
          onPay={(e) => {
            e.stopPropagation()
            goToDetails()
          }}
        />
      )}
    </HistoryCard>
  )
}
