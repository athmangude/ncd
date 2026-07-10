import { usePaymentHistory } from "../hooks/usePaymentHistory"
import PatientDashboardSection from "./PatientDashboardSection"
import { TransactionHistoryList } from "@/components/TransactionHistoryList"
import {
  HistoryCard,
  HistoryEntry,
  AmountTime,
  HistoryChevron,
  LoanEntry,
} from "@/components/HistoryCard"
import { formatDateLong } from "@/utilities/dateUtilities"
import { useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { trackEvent, EVENTS } from "@/analytics"
import { safeAmount } from "@/analytics/metadata"

export default function YourTreatments({
  showTitle = true,
  loans: propLoans,
}: {
  showTitle?: boolean
  loans?: any[]
}) {
  const { data: paymentHistory } = usePaymentHistory()
  const loans = useMemo(
    () => propLoans || paymentHistory?.loans || [],
    [propLoans, paymentHistory?.loans]
  )

  const content = (
    <TransactionHistoryList
      items={loans}
      getKey={(loan: any) => loan.id}
      getDate={(loan: any) => loan.createdAt}
      renderItem={(loan: any) => (
        <LoanCard
          loanId={loan.id}
          status={loan.status}
          hospitalName={
            loan?.patientMedicalInfoRequest?.facility?.name ?? "Care Facility"
          }
          createdAt={loan.createdAt}
          outStandingAmount={loan.outstandingAmount}
          currency={loan?.currency?.code ?? "KES"}
          amount={loan.amount}
          dueDate={loan.loanDueDate}
        />
      )}
    />
  )

  if (showTitle) {
    return (
      <PatientDashboardSection title="Your Treatments">
        {content}
      </PatientDashboardSection>
    )
  }

  return content
}

// eslint-disable-next-line react-refresh/only-export-components
export function resolveStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-muted-foreground"
    case "SUBMITTED_FOR_APPROVAL":
      return "bg-warning-solid"
    case "APPROVED":
      return "bg-success-solid"
    case "PAID_TRANSACTION_FEE":
      return "bg-primary"
    case "DISBURSED":
      return "bg-warning-solid"
    case "PAID":
      return "bg-success-solid"
    case "REPAYMENT":
      return "bg-info-solid"
    case "REJECTED":
      return "bg-destructive"
    case "DEFAULTED":
      return "bg-destructive"
    case "OVERDUE":
      return "bg-destructive"
    default:
      return "bg-muted-foreground"
  }
}

export function LoanCard({
  loanId,
  status,
  hospitalName,
  createdAt,
  outStandingAmount,
  currency,
  amount,
  dueDate,
}: {
  loanId: string | number
  status: string
  hospitalName?: string
  createdAt: string
  outStandingAmount: number
  currency: string
  amount: string | number
  dueDate: string
}) {
  const navigate = useNavigate()

  const daysRemaining = dueDate
    ? Math.ceil(
        (new Date(dueDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  // Format: "DD Mon" (e.g., "12 Nov")
  const formattedDueDate = dueDate
    ? formatDateLong(dueDate).split(" ").slice(0, 2).join(" ")
    : ""

  const trackTap = () => {
    try {
      trackEvent(EVENTS.LOAN_REPAYMENT.HISTORY_LOAN_CARD_TAP, {
        loanId,
        loanStatus: status,
        outstandingAmount: safeAmount(outStandingAmount),
      })
    } catch {
      // Silent fail
    }
  }

  const goToDetails = () => {
    trackTap()
    navigate(`/patients/loans/loan-details/${loanId}`)
  }

  // A PAID loan reads as fully repaid regardless of the raw outstanding value.
  const outstanding = status === "PAID" ? 0 : outStandingAmount

  return (
    <HistoryCard onClick={goToDetails}>
      {/* Header row — same anatomy as a payment card. No leading icon. */}
      <HistoryEntry
        title={`Paid at ${(hospitalName ?? "Unknown facility").toLocaleLowerCase()}`}
        subtitle={
          <AmountTime
            amount={Number(amount)}
            currency={currency}
            createdAt={createdAt}
          />
        }
        trailing={<HistoryChevron />}
      />

      {/* Loan sub-entry — the shared atom, identical to the payment card's. */}
      <LoanEntry
        outstandingAmount={outstanding}
        amount={amount}
        currency={currency}
        dueDate={dueDate}
        formattedDueDate={formattedDueDate}
        daysRemaining={daysRemaining}
        onPay={(e) => {
          e.stopPropagation()
          goToDetails()
        }}
      />
    </HistoryCard>
  )
}
