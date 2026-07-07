import PatientPageWrapper from "../PatientPageWrapper"
import Tag from "@/components/Tag"
import { DialogTrigger } from "@/components/Dialog"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Amount } from "@/components/Amount"
import { formatTime, formatDateLong } from "@/utilities/dateUtilities"
import { Button } from "@/components/Button"
import { useQuery } from "@tanstack/react-query"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { usePatientLoanStore } from "../../stores/patientLoanStore"
import PaymentPortal from "../Payment/PatientPaymentPortal"
import { formatEnum } from "@/utilities/textUtilities"
import { resolveStatusColor } from "../../components/YourTreatments"
import { RepaymentTimeline } from "../../components/RepaymentTimeline"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"
import { safeAmount } from "@/analytics/metadata"
import {
  User,
  Building,
  Banknote,
  Clock,
  RotateCw,
  Wallet,
  Coins,
  AlertTriangle,
} from "lucide-react"

export const getPatientLoanDetailsQueryKey = "getPatientLoanDetails"
export default function ViewLoanDetails() {
  const navigate = useNavigate()
  const id = useParams().id
  const setLoan = usePatientLoanStore((state: any) => state.setLoan)

  const query = useQuery({
    queryKey: [getPatientLoanDetailsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/loans/patient/me/${id}`
      )

      setLoan(response.data)
      return response.data
    },
  })

  useEffect(() => {
    if (!query.isSuccess) return
    try {
      trackEvent(EVENTS.LOAN_REPAYMENT.LOAN_DETAILS_VIEW, {
        loanId: id,
        loanStatus: query.data?.status,
        outstandingAmount: safeAmount(query.data?.outstandingAmount),
      })
    } catch {
      // Silent fail
    }
    // Fire-once-on-first-success: re-firing on data updates would inflate the view event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isSuccess])

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const {
    amount,
    totalBillAmount,
    currency,
    createdAt,
    loanDueDate,
    firstPaymentDue,
    loanType,
    transactions,
    patientMedicalInfoRequest,
    outstandingAmount,
    careFundDiscountAmount,
    status,
  } = query.data

  const { facility, patientName } = patientMedicalInfoRequest || {}

  const repaymentPeriodDays = Math.ceil(
    (new Date(loanDueDate).getTime() - new Date(createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  const canMakePayment = resolveCanMakePayment({
    loanType,
  })

  // Calculate repaid amount (approximate based on outstanding)
  const totalToRepay =
    amount +
    (query.data.accumulatedInterestAmount || 0) +
    (query.data.lateFees || 0)
  const totalRepaid =
    transactions?.reduce(
      (acc: number, curr: any) => acc + Number(curr.amount),
      0
    ) || 0

  // Repaying the remaining balance early earns 5% cashback (mirrors the
  // initiate-repayment reward). Shrinks as the loan is paid down, so it reflects
  // the post-repayment outstanding after each (even partial) repayment.
  const potentialCashback = Math.round(Number(outstandingAmount || 0) * 0.05)

  // Progress calculation
  const totalDue =
    totalToRepay > 0 ? totalToRepay : outstandingAmount + totalRepaid
  const progressPercent =
    totalDue > 0 ? (totalRepaid / totalBillAmount) * 100 : 0

  const currencyCode = currency?.code || "KES"
  const createdDate = new Date(createdAt)
  const dueDate = new Date(loanDueDate)

  const formattedDueDate = formatDateLong(dueDate)
    .split(" ")
    .slice(0, 2)
    .join(" ") // "DD Mon"
  const formattedCreatedDate = formatDateLong(createdDate)
    .split(" ")
    .slice(0, 2)
    .join(" ") // "DD Mon"
  const formattedCreatedTime = formatTime(createdDate)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDateOnly = new Date(dueDate)
  dueDateOnly.setHours(0, 0, 0, 0)
  const isOnOrPastDue = dueDateOnly.getTime() <= today.getTime()

  // Group transactions by date for accurate display
  const groupTransactionsByDate = (transactions: any[]) => {
    if (!transactions || transactions.length === 0) return []

    const grouped: { date: string; formattedDate: string; items: any[] }[] = []
    const dateMap = new Map<string, any[]>()

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date)
      const dateKey = transactionDate.toDateString() // e.g., "Wed Feb 12 2026"

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, [])
      }
      dateMap.get(dateKey)!.push(transaction)
    })

    // Convert map to array and sort by date (newest first)
    dateMap.forEach((items, dateKey) => {
      const transactionDate = new Date(items[0].date)
      const formattedDate = formatDateLong(transactionDate)
        .split(" ")
        .slice(0, 2)
        .join(" ") // "DD Mon"
      grouped.push({
        date: dateKey,
        formattedDate,
        items: items.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ), // Sort by time within date group
      })
    })

    // Sort groups by date (newest first)
    return grouped.sort(
      (a, b) =>
        new Date(b.items[0].date).getTime() -
        new Date(a.items[0].date).getTime()
    )
  }

  const groupedTransactions = groupTransactionsByDate(transactions || [])

  // const lateFeeAmount = amount * (Number(lateFeePercentage) / 100)

  return (
    <PatientPageWrapper
      title="Loan details"
      onBack={() => navigate("/patients", { state: { subTab: "loans" } })}
      className="bg-muted min-h-screen pb-10"
    >
      <div className="flex flex-col gap-6 px-4">
        {/* Top Date/Time */}
        <div className="text-center text-sm text-muted-foreground mt-2">
          {formattedCreatedDate} • {formattedCreatedTime}
        </div>

        {/* Title */}
        <div className="text-center px-4">
          <h1 className="text-foreground">
            Bill paid at
            <br />
            {facility?.name || "Healthcare Provider"}
          </h1>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-5">
          <DetailRow
            icon={<User className="w-5 h-5 text-muted-foreground" />}
            label="Patient name"
            value={patientName || "Firstname Lastname"}
          />
          <DetailRow
            icon={<Building className="w-5 h-5 text-muted-foreground" />}
            label="Healthcare provider"
            value={facility?.name || "Care Provider Name"}
          />
          <DetailRow
            icon={<Banknote className="w-5 h-5 text-muted-foreground" />}
            label="Loan Amount"
            value={formatMoney(totalBillAmount, currencyCode)}
          />
        </div>

        {status !== "PAID" && (
          <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 border-2 border-purple-200 border-dashed rounded-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  Your loan is due on {formattedDueDate}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <Amount
                      value={totalRepaid}
                      currency={currencyCode}
                      size="sm"
                      weight="bold"
                    />
                    <span className="text-muted-foreground text-xs">
                      Repaid
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <Amount
                      value={totalBillAmount}
                      currency={currencyCode}
                      size="sm"
                      weight="bold"
                    />
                    <span className="text-muted-foreground text-xs">
                      Total to repay
                    </span>
                  </div>
                </div>
              </div>

              {/* Incentive / Info Box (or warning when on/past due) */}
              {isOnOrPastDue && careFundDiscountAmount <= 0 ? (
                <div className="bg-red-50 rounded-xl p-3 flex gap-3 items-start border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-foreground">
                      Repayment required
                    </span>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      Your loan is due. Please repay to avoid late fees.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 rounded-xl p-3 flex gap-3 items-start">
                  <RotateCw className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-foreground">
                      {careFundDiscountAmount > 0
                        ? `Care Fund Discount Applied!`
                        : `Repay before ${formattedDueDate} and earn!`}
                    </span>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      {careFundDiscountAmount > 0
                        ? `You saved ${formatMoney(careFundDiscountAmount, currencyCode)} on this bill.`
                        : `Earn ${formatMoney(potentialCashback, currencyCode)} cashback when you repay early!`}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {canMakePayment && (
                <PaymentPortal
                  loanId={Number(id)}
                  initialPaymentAmount={Number(outstandingAmount) || 0}
                  maxPayableAmount={Number(outstandingAmount) || 0}
                  amountIsChangeable={true}
                  title="Make Loan Payment"
                  description={`Payment for treatment`}
                  isTransactionFeePayment={false}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        try {
                          trackEvent(EVENTS.LOAN_REPAYMENT.REPAY_BUTTON_TAP, {
                            loanId: id,
                            loanStatus: status,
                            outstandingAmount: safeAmount(outstandingAmount),
                          })
                        } catch {
                          // Silent fail
                        }
                      }}
                    >
                      Make a repayment
                    </Button>
                  </DialogTrigger>
                </PaymentPortal>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="flex flex-col mt-2">
          {/* Timeline Items */}
          <div className="flex flex-col relative">
            {/* Vertical Line Container - spans the whole height */}
            <div className="absolute left-3 top-2 bottom-0 w-px bg-border" />

            {/* Repayments (History) - Grouped by Date */}
            {groupedTransactions.map((group) => (
              <div key={group.date}>
                <div className="text-sm text-muted-foreground mb-4 px-1 mt-6 first:mt-0">
                  {group.formattedDate}
                </div>
                {group.items.map((t: any, idx: number) => (
                  <TimelineItem
                    key={`${group.date}-${idx}`}
                    icon={<Clock className="w-4 h-4 text-muted-foreground" />}
                    title={t.description}
                    amount={t.amount}
                    currency={currencyCode}
                    time={formatTime(t.date)}
                    isLast={false}
                  />
                ))}
              </div>
            ))}

            {/* Original Payment Event */}
            <div className="mt-6 mb-2 text-sm text-muted-foreground px-1">
              {formattedCreatedDate}
            </div>
            <TimelineItem
              icon={<Wallet className="w-4 h-4 text-muted-foreground" />}
              title={`Paid at ${facility?.name?.split(" ")[0] || "Provider"}`} // Shorten name for space
              subtitle={facility?.name}
              amount={totalBillAmount}
              currency={currencyCode}
              time={formatTime(createdAt)}
              isLast={false}
            />

            {/* Cashback if applicable */}
            {careFundDiscountAmount > 0 && (
              <TimelineItem
                icon={<Coins className="w-4 h-4 text-muted-foreground" />}
                title="Cashback earned"
                amount={careFundDiscountAmount}
                currency={currencyCode}
                isLast={true}
              />
            )}
          </div>
        </div>

        {/* Existing RepaymentTimeline for ADVANCE loans - keeping it just in case */}
        {loanType === "ADVANCE" && (
          <div className="mt-4">
            <RepaymentTimeline
              loanAmount={amount}
              currency={currencyCode}
              repaymentPeriodDays={repaymentPeriodDays}
              className="mt-5"
              firstPaymentDue={firstPaymentDue}
            />
          </div>
        )}
      </div>
    </PatientPageWrapper>
  )
}

function DetailRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

function TimelineItem({
  icon,
  title,
  subtitle,
  amount,
  currency,
  time,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  amount?: number
  currency?: string
  time?: string
  isLast: boolean
}) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Dot/Icon Background */}
      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted ring-4 ring-white">
        {icon}
      </div>

      <div className="flex flex-1 justify-between items-start -mt-0.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {amount !== undefined && (
            <Amount
              value={amount}
              currency={currency || "KES"}
              size="sm"
              className="text-muted-foreground"
            />
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
        {time && <span className="text-xs text-muted-foreground">{time}</span>}
      </div>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export enum LoanType {
  MEMBERSHIP = "MEMBERSHIP", //Default public loan type
  PAY = "PAY", // Sacco
  ADVANCE = "ADVANCE", //Employers
  GRANT = "GRANT", //NGOs
}

function resolveCanMakePayment({ loanType }: { loanType: LoanType }) {
  if (loanType === "ADVANCE") {
    return false
  }

  const canMakePayment = true

  return canMakePayment
}

// Restoring MedicalRequestDetails for compatibility with PatientInvoiceDetails.tsx
export function MedicalRequestDetails() {
  const { patientMedicalInfoRequest, status } =
    usePatientLoanStore((state: any) => state.loan) || {}

  const { facility, patientName } = patientMedicalInfoRequest || {}
  return (
    <section className="border pt-2 p-3 rounded-lg">
      {" "}
      {/* Hidden because it's not used in this view anymore but needed for export */}
      <div className="flex justify-between">
        <h1 className="text-ellipsis">{facility?.name || "No Facility"}</h1>

        {status && (
          <Tag className={`${resolveStatusColor(status)}`}>
            {formatEnum(status)}
          </Tag>
        )}
      </div>
      {patientName && (
        <p className="bg-primary/5 py-2 px-3 flex items-center justify-between mt-5 rounded-lg gap-5">
          Patient Name{" "}
          <span className="text-muted-foreground text-right">
            {patientName}
          </span>
        </p>
      )}
    </section>
  )
}
