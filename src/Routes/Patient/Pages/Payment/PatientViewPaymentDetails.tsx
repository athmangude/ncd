import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import PatientPageWrapper from "../PatientPageWrapper"
import { formatMoney } from "@/utilities/currencyUtilities"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { trackEvent, EVENTS } from "@/analytics"
import {
  User,
  Building2,
  Banknote,
  Wallet,
  ChevronRight,
  RefreshCcw,
  Clock,
  AlertCircle,
  FileDown,
  CheckCircle2,
  Star,
} from "lucide-react"
import { format, isBefore, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { Button } from "@/components/Button"
// import { formatEnum } from "@/utilities/textUtilities"
import PaymentPortal from "./PatientPaymentPortal"
import { DialogTrigger } from "@/components/Dialog"
import { useDownloadReceipt } from "../../hooks/useDownloadReceipt"
import { useReviewEligibility } from "@/Routes/Patient/Pages/Dashboard/components/discovery/facility-details/reviews/useReviewEligibility"

export const getPatientPaymentDetailsQueryKey = "getPatientPaymentDetails"

export default function PatientViewPaymentDetails() {
  const id = useParams().id
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: { from?: string; facilityId?: string | number }
  }

  /**
   * Back-target resolution: if the caller passed a `from` hint via location
   * state, route back to the matching origin. Otherwise fall back to the
   * dashboard payments tab so legacy entry points behave as before.
   */
  const handleBack = () => {
    if (state?.from === "facility-details" && state.facilityId != null) {
      navigate(`/patients/facility/${state.facilityId}?tab=activity`)
      return
    }
    navigate("/patients", { state: { tab: "home", subTab: "payments" } })
  }

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.LOAN_REPAYMENT.PAYMENT_VIEW, {
        paymentId: id,
      })
    } catch {
      // Silent fail
    }
  }, [id])

  const query = useQuery({
    queryKey: [getPatientPaymentDetailsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/payments/user/payment-details?paymentId=${id}`
      )
      return response.data
    },
  })

  const { status: receiptStatus, download: downloadReceipt } =
    useDownloadReceipt(id)

  const facilityId = query.data?.patientMedicalInfoRequest?.facility?.id
  const { data: reviewEligibility } = useReviewEligibility(
    facilityId != null ? String(facilityId) : undefined
  )
  const canShowReviewPrompt =
    facilityId != null && reviewEligibility?.canReview === true

  const reviewPromptViewFiredRef = useRef(false)
  useEffect(() => {
    if (canShowReviewPrompt && !reviewPromptViewFiredRef.current) {
      reviewPromptViewFiredRef.current = true
      try {
        trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_PROMPT_VIEW, {
          paymentId: id,
          facilityId,
          source: "payment-details",
        })
      } catch {
        // Silent fail
      }
    }
  }, [canShowReviewPrompt, facilityId, id])

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const {
    totalBillAmount,
    createdAt,
    currency,
    patientMedicalInfoRequest,
    paymentSplits,
    user,
    cashbackDetails,
  } = query.data

  const currencyCode = currency?.code ?? "KES"
  const providerName =
    patientMedicalInfoRequest?.medicalInvoiceFile?.careProviderName ||
    patientMedicalInfoRequest?.facility?.name ||
    "Care Provider"

  const patientName = user
    ? `${user.firstName} ${user.lastName} (myself)`
    : "Me (myself)"

  const formattedDate = format(new Date(createdAt), "d MMM • h:mm a")

  // Extract Loan Data
  const discountSplit = paymentSplits?.find(
    (split: any) =>
      split.wallet?.type === "DISCOUNT" || split.wallet?.type === "DISCOUNTS"
  )
  const discountAmount = discountSplit
    ? Number(discountSplit.paymentSplitAmount)
    : 0
  const finalAmount = Number(totalBillAmount) - discountAmount

  const loanSplit = paymentSplits?.find(
    (split: any) => split.wallet?.type === "LOAN"
  )
  const loan = loanSplit?.loan

  // Loan Calculations
  const totalRepaid = loan ? Number(loan.totalPaid) : 0
  const totalLoanAmount = loan ? Number(loan.totalBillAmount) : 0
  const outstandingAmount = loan ? Number(loan.outstandingAmount) : 0
  const progress =
    totalLoanAmount > 0 ? (totalRepaid / totalLoanAmount) * 100 : 0
  const isUnpaid = outstandingAmount > 0
  const loanDueDate = loan?.loanDueDate ? new Date(loan.loanDueDate) : null
  const isNotOverdue = loanDueDate ? isBefore(new Date(), loanDueDate) : false

  const daysUntilDue = loanDueDate
    ? differenceInDays(loanDueDate, new Date())
    : null
  const isWithinPenaltyWarningWindow =
    daysUntilDue !== null && daysUntilDue <= 5 && daysUntilDue >= 0

  const showPenaltyBanner = isUnpaid && isWithinPenaltyWarningWindow
  const showCashbackBanner =
    isUnpaid && isNotOverdue && loan && !showPenaltyBanner

  const penaltyAmount = outstandingAmount * 0.02

  // Build Timeline Events
  interface TimelineEvent {
    id: string
    type: "PAYMENT" | "REPAYMENT" | "CASHBACK" | "PAYMENT_SPLIT"
    date: string
    title: string
    amount: string
    subtitle?: string
    icon?: React.ReactNode
    isScore?: boolean
    subEvents?: TimelineEvent[]
  }

  const events: TimelineEvent[] = []

  // 1. Main Payment
  const mainPaymentEvent: TimelineEvent = {
    id: "main-payment",
    type: "PAYMENT",
    date: createdAt,
    title: `Paid at ${providerName}`,
    amount: formatMoney(totalBillAmount, currencyCode),
    icon: <Wallet className="w-4 h-4 text-muted-foreground" />,
    subEvents: [],
  }

  // // 2. Payment Splits (Sources) - Add as sub-events to main payment
  // if (paymentSplits) {
  //   paymentSplits.forEach((split: any) => {
  //       mainPaymentEvent.subEvents?.push({
  //           id: split.id,
  //           type: 'PAYMENT_SPLIT',
  //           date: split.createdAt,
  //           title: `${formatEnum(split.wallet.type)} Wallet`,
  //           amount: formatMoney(split.paymentSplitAmount, currencyCode),
  //           icon: <RefreshCcw className="w-3 h-3 text-muted-foreground" />
  //       })
  //   })
  // }

  events.push(mainPaymentEvent)

  // 3. Repayments
  if (loan?.transactions) {
    const repayments = loan.transactions
      .filter((t: any) => t.transactionType === "COLLECTION")
      .sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

    repayments.forEach((t: any) => {
      events.push({
        id: t.id,
        type: "REPAYMENT",
        date: t.createdAt,
        title: t.description,
        amount: formatMoney(t.amount, currencyCode),
        isScore: true,
        icon: <Clock className="w-4 h-4 text-muted-foreground" />,
      })
    })
  }

  // 3. Cashback
  if (cashbackDetails) {
    cashbackDetails.forEach((c: any, index: number) => {
      events.push({
        id: `cashback-${index}`,
        type: "CASHBACK",
        date: createdAt, // Assuming cashback happens at payment time
        title: `${c.source}`,
        amount: formatMoney(c.amount, currencyCode),
        icon: <RefreshCcw className="w-4 h-4 text-muted-foreground" />,
      })
    })
  }

  // Sort events descending (newest first)
  // For events with same timestamp, we want Repayments > Payment > Cashback (visually)
  // But if sorting descending by time:
  // Repayment (Feb 5) > Payment (Feb 2) > Cashback (Feb 2)
  events.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (dateA !== dateB) return dateB - dateA

    // Secondary sort for same time
    const typePriority = {
      REPAYMENT: 4,
      PAYMENT: 3,
      PAYMENT_SPLIT: 2,
      CASHBACK: 1,
    }
    return typePriority[b.type] - typePriority[a.type]
  })

  // Group by date for display? The design just shows a list.
  // But it shows "DD Mon" headers.
  // We can just render them and insert headers when date changes.

  const groupedEvents: { dateLabel: string; items: TimelineEvent[] }[] = []

  events.forEach((event) => {
    const dateLabel = format(new Date(event.date), "dd MMM yyyy")
    const lastGroup = groupedEvents[groupedEvents.length - 1]

    if (lastGroup && lastGroup.dateLabel === dateLabel) {
      lastGroup.items.push(event)
    } else {
      groupedEvents.push({ dateLabel, items: [event] })
    }
  })

  return (
    <PatientPageWrapper
      title="Payment details"
      onBack={handleBack}
      bodyPadding="none"
      className="bg-muted min-h-screen"
    >
      <div className="px-5 pb-10">
        {/* Header Section */}
        <div className="flex flex-col items-center mt-6 mb-8 text-center">
          <p className="text-muted-foreground text-sm mb-1">{formattedDate}</p>
          <h1 className="text-foreground leading-tight">
            Bill paid at <br /> {providerName}
          </h1>
        </div>

        {/* Details Card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-6">
          <DetailRow
            icon={<User className="w-5 h-5 text-muted-foreground" />}
            label="Patient name"
            value={patientName}
          />
          <DetailRow
            icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
            label="Healthcare provider"
            value={providerName}
          />
          <DetailRow
            icon={<Banknote className="w-5 h-5 text-muted-foreground" />}
            label="Total bill"
            value={
              discountAmount > 0 ? (
                <div className="flex items-center gap-2 justify-end">
                  <span className="line-through text-muted-foreground text-xs">
                    {formatMoney(totalBillAmount, currencyCode)}
                  </span>
                  <span>{formatMoney(finalAmount, currencyCode)}</span>
                </div>
              ) : (
                formatMoney(totalBillAmount, currencyCode)
              )
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  navigate(`/patients/payments/how-you-paid/${id}`)
                }
              >
                How you paid <ChevronRight className="w-3 h-3" />
              </Button>
            }
            isLast
          />
        </div>

        {canShowReviewPrompt && (
          <ReviewPromptCard
            providerName={providerName}
            onLeaveReview={() => {
              try {
                trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_PROMPT_TAP, {
                  paymentId: id,
                  facilityId,
                  source: "payment-details",
                })
              } catch {
                // Silent fail — analytics must never break the user flow
              }
              navigate(`/patients/facility/${facilityId}/review`, {
                state: { from: "payment-details", paymentId: id },
              })
            }}
          />
        )}

        {/* Loan Section */}
        {loan && isUnpaid && (
          <div className="bg-card border-2 border-dashed border-purple-200 rounded-lg p-5 mb-8 relative">
            {/* Loan Header */}
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <p className="text-foreground ">
                Your loan is due on{" "}
                <span className="font-medium">
                  {loanDueDate ? format(loanDueDate, "dd MMM") : "N/A"}
                </span>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-lg h-1.5 mb-2">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-sm mb-6">
              <div>
                <p className="font-semibold text-foreground">
                  {formatMoney(totalRepaid, currencyCode)}
                </p>
                <p className="text-muted-foreground text-xs">Repaid</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {formatMoney(totalLoanAmount, currencyCode)}
                </p>
                <p className="text-muted-foreground text-xs">Total to repay</p>
              </div>
            </div>

            {/* Penalty Banner */}
            {showPenaltyBanner && (
              <div className="bg-red-50 rounded-xl p-3 flex gap-3 mb-4">
                <div className="mt-0.5">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-red-800 text-sm leading-relaxed">
                    If your loan payment is delayed, there will be a penalty fee
                    of {formatMoney(penaltyAmount, currencyCode)} (2%) daily.
                  </p>
                </div>
              </div>
            )}

            {/* Cashback Banner */}
            {showCashbackBanner && (
              <div className="bg-green-50 rounded-xl p-3 flex gap-3 mb-4">
                <div className="mt-0.5">
                  <RefreshCcw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Repay before{" "}
                    {loanDueDate ? format(loanDueDate, "dd MMM") : ""} and earn!
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                    Earn {loan.amount * 0.05} cashback when you repay before the
                    due date!
                  </p>
                </div>
              </div>
            )}

            {/* Repayment Button */}
            <PaymentPortal
              loanId={loan.id}
              initialPaymentAmount={outstandingAmount}
              maxPayableAmount={outstandingAmount}
              amountIsChangeable={true}
              title="Make Loan Payment"
              description={`Payment for treatment`}
              isTransactionFeePayment={false}
            >
              <DialogTrigger className="w-full" asChild>
                <Button className="w-full ">
                  Make a repayment{" "}
                  {formatMoney(outstandingAmount, currencyCode)}
                </Button>
              </DialogTrigger>
            </PaymentPortal>
          </div>
        )}

        {/* Timeline Section */}
        <div className="mt-4">
          {groupedEvents.map((group) => (
            <div key={group.dateLabel} className="mb-6">
              <p className="text-muted-foreground text-xs font-medium mb-4 uppercase pl-2">
                {group.dateLabel}
              </p>

              <div
                className={cn(
                  "relative pl-4 ml-4 space-y-8 pb-2",
                  // Add border left only if not the last group or if it has multiple items?
                  // The design shows a continuous line.
                  // We can just put a border on the container and cover it up if needed.
                  "border-l-2 border-border"
                )}
              >
                {group.items.map((event) => (
                  <TimelineItem
                    key={event.id}
                    icon={event.icon}
                    title={event.title}
                    amount={event.amount}
                    time={format(new Date(event.date), "h:mm a")} // Display time in AM/PM format
                    subEvents={event.subEvents}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Generate PDF Receipt */}
        <Button
          variant="secondary"
          className="w-full mt-1"
          disabled={receiptStatus === "loading"}
          isLoading={receiptStatus === "loading"}
          onClick={downloadReceipt}
          aria-label="Generate PDF receipt for this transaction"
        >
          {receiptStatus === "success" ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-purple-600" /> Receipt
              Downloaded
            </>
          ) : receiptStatus === "error" ? (
            <>
              <FileDown className="mr-2 h-4 w-4 text-purple-600" /> Retry
              Download
            </>
          ) : receiptStatus === "loading" ? (
            <>Generating Receipt…</>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4 text-purple-600" /> Download PDF
              Receipt
            </>
          )}
        </Button>
      </div>
    </PatientPageWrapper>
  )
}

function DetailRow({
  icon,
  label,
  value,
  action,
  isLast,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  action?: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div className={cn("flex gap-3 py-3", !isLast && "border-b border-border")}>
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <p className="text-foreground font-medium text-sm">{label}</p>
        <div className="text-muted-foreground text-sm mt-0.5">{value}</div>
      </div>
      {action && <div className="self-center">{action}</div>}
    </div>
  )
}

function TimelineItem({
  icon,
  title,
  amount,
  time,
  subEvents,
}: {
  icon: React.ReactNode
  title: string
  amount?: string
  time?: string
  subEvents?: any[]
}) {
  return (
    <div className="relative pl-6">
      <div className="absolute -left-[25px] bg-card border border-border p-1.5 rounded-full shadow-sm z-10">
        {icon}
      </div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-foreground font-medium text-sm capitalize">
            {(title ?? "").toLocaleLowerCase()}
          </p>
          <p className="text-muted-foreground text-sm mt-0.5">{amount}</p>

          {/* Sub Events (Splits) */}
          {subEvents && subEvents.length > 0 && (
            <div className="mt-3 space-y-3">
              {subEvents.map((subEvent) => (
                <div
                  key={subEvent.id}
                  className="flex items-start gap-2 relative"
                >
                  {/* Connector line */}
                  <div className="absolute -left-[19px] top-2 w-3 h-[1px] bg-border"></div>

                  <div className="bg-muted p-1 rounded-full border border-border">
                    {subEvent.icon}
                  </div>
                  <div>
                    <p className="text-foreground text-xs font-medium">
                      {subEvent.title}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {subEvent.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {time && <span className="text-muted-foreground text-xs">{time}</span>}
      </div>
    </div>
  )
}

function ReviewPromptCard({
  providerName,
  onLeaveReview,
}: {
  providerName: string
  onLeaveReview: () => void
}) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-0.5 bg-secondary p-2 rounded-full">
          <Star className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-foreground font-semibold text-base leading-snug">
            How was your visit at {providerName}?
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Share your experience to help other patients.
          </p>
        </div>
      </div>
      <Button variant="secondary" className="w-full" onClick={onLeaveReview}>
        Leave a review
      </Button>
    </div>
  )
}
