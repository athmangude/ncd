import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import PatientDashboardSection from "@/Routes/Patient/components/PatientDashboardSection"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"
import { ChevronRight, Clock, Link } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatTime, formatDateLong } from "@/utilities/dateUtilities"
import { useMemo } from "react"

export default function YourPayments() {
  const { data: paymentHistory } = usePaymentHistory()
  const payments = useMemo(
    () => paymentHistory?.payments || [],
    [paymentHistory?.payments]
  )

  const groupedPayments = useMemo(() => {
    if (!payments) return []

    // Sort by date descending
    const sorted = [...payments].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const groups: { date: string; items: any[] }[] = []

    sorted.forEach((payment: any) => {
      // formatDateLong returns "DD Mon YYYY"
      const groupKey = formatDateLong(payment.createdAt)

      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.date === groupKey) {
        lastGroup.items.push(payment)
      } else {
        groups.push({ date: groupKey, items: [payment] })
      }
    })
    return groups
  }, [payments])

  return (
    <PatientDashboardSection title="Your Payments">
      <div className="flex flex-col max-h-[400px] overflow-y-auto gap-6">
        {groupedPayments.map((group) => (
          <div key={group.date} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground font-medium ml-1">
              {group.date}
            </p>
            <div className="flex flex-col gap-3">
              {group.items.map((payment: any) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
            </div>
          </div>
        ))}
      </div>
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
    <div
      className="p-4 flex flex-col gap-3 bg-white hover:bg-muted transition-colors cursor-pointer border rounded-xl"
      onClick={() =>
        navigate(`/patients/payments/payment-details/${paymentId}`, {
          state: navigationState,
        })
      }
    >
      {/* Header Row */}
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-2">
          <p className="text-base text-foreground line-clamp-1 capitalize">
            {(facilityName ?? "").startsWith("Paid at") ||
            (facilityName ?? "").startsWith("Payment at")
              ? (facilityName ?? "")
              : `Paid at ${(facilityName ?? "").toLocaleLowerCase()}`}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatMoney(Number(totalBillAmount), currencyCode)} •{" "}
            {formatTime(createdAt)}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Cashback Row */}
      {hasCashback && (
        <div className="flex items-center gap-2">
          <Link className="w-4 h-4 text-muted-foreground rotate-45" />
          <div className="flex flex-col">
            <p className="text-sm text-foreground">Cashback earned</p>
            <p className="text-sm text-muted-foreground">
              {formatMoney(totalCashback, currencyCode)}
            </p>
          </div>
        </div>
      )}

      {/* Loan Row */}
      {hasLoan && (
        <div className="flex flex-col gap-3 mt-1">
          {outstandingAmount > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">Loan repayment due:</p>
                </div>
                {dueDate && daysRemaining > 0 ? (
                  <div className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                    {daysRemaining < 10 ? "0" : ""}
                    {daysRemaining} days
                  </div>
                ) : (
                  <div className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                    Overdue
                  </div>
                )}
              </div>

              <div className="pl-6">
                <p className="text-sm text-muted-foreground">
                  {formatMoney(Number(outstandingAmount), currencyCode)} due by{" "}
                  {formattedDueDate}
                </p>
              </div>

              <Button
                variant="secondary"
                className="w-full mt-1"
                onClick={(e) => {
                  e.stopPropagation()
                  // Add specific payment logic here if needed, otherwise it bubbles to card click
                  navigate(`/patients/payments/payment-details/${paymentId}`, {
                    state: navigationState,
                  })
                }}
              >
                Pay now
              </Button>
            </>
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
                  {formatMoney(Number(loan.totalPaid), currencyCode)}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
