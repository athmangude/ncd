import { usePaymentHistory } from "../hooks/usePaymentHistory"
import PatientDashboardSection from "./PatientDashboardSection"
import { formatTime, formatDateLong } from "@/utilities/dateUtilities"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"
import { Badge } from "@/components/Badge"
import { ChevronRight, Clock } from "lucide-react"
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

  const groupedLoans = useMemo(() => {
    if (!loans) return []

    // Sort by date descending
    const sorted = [...loans].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const groups: { date: string; items: any[] }[] = []

    sorted.forEach((loan: any) => {
      // formatDateLong returns "DD Mon YYYY"
      const groupKey = formatDateLong(loan.createdAt)

      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.date === groupKey) {
        lastGroup.items.push(loan)
      } else {
        groups.push({ date: groupKey, items: [loan] })
      }
    })
    return groups
  }, [loans])

  const content = (
    <div className="flex flex-col max-h-[400px] overflow-y-auto gap-6">
      {groupedLoans.map((group) => (
        <div key={group.date} className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground font-medium ml-1">
            {group.date}
          </p>
          <div className="flex flex-col gap-3">
            {group.items.map((loan: any) => (
              <LoanCard
                key={loan.id}
                loanId={loan.id}
                status={loan.status}
                hospitalName={
                  loan?.patientMedicalInfoRequest?.facility?.name ??
                  "Care Facility"
                }
                createdAt={loan.createdAt}
                outStandingAmount={loan.outstandingAmount}
                currency={loan?.currency?.code ?? "KES"}
                amount={loan.amount}
                dueDate={loan.loanDueDate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
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

  return (
    <div
      className="border rounded-xl p-4 grid gap-4 bg-white"
      onClick={() => {
        try {
          trackEvent(EVENTS.LOAN_REPAYMENT.HISTORY_LOAN_CARD_TAP, {
            loanId,
            loanStatus: status,
            outstandingAmount: safeAmount(outStandingAmount),
          })
        } catch {
          // Silent fail
        }
        navigate(`/patients/loans/loan-details/${loanId}`)
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-base  text-foreground capitalize">
            Paid at {(hospitalName ?? "Unknown facility").toLocaleLowerCase()}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatMoney(Number(amount), currency)} • {formatTime(createdAt)}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>

      {status !== "PAID" ? (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground">Loan repayment due:</p>
            </div>
            {dueDate && daysRemaining > 0 && (
              <Badge variant="warning">{daysRemaining} days</Badge>
            )}
            {dueDate && daysRemaining <= 0 && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            {formatMoney(outStandingAmount, currency)} due by {formattedDueDate}
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground">Loan repaid</p>
            </div>
          </div>

          <div className="pl-6">
            <p className="text-sm text-muted-foreground">
              {formatMoney(Number(amount), currency)}
            </p>
          </div>
        </>
      )}

      {status !== "PAID" && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            try {
              trackEvent(EVENTS.LOAN_REPAYMENT.HISTORY_LOAN_CARD_TAP, {
                loanId,
                loanStatus: status,
                outstandingAmount: safeAmount(outStandingAmount),
              })
            } catch {
              // Silent fail
            }
            navigate(`/patients/loans/loan-details/${loanId}`)
          }}
        >
          Pay now
        </Button>
      )}
    </div>
  )
}
