import PatientPinPrompt from "@/Routes/Patient/components/PatientPinPrompt"
import AmountContainer from "@/Routes/Patient/components/AmountContainer"
import { SectionTitle } from "@/components/SectionTitle"
import { useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import { useFastTrackStore } from "./useFastTrackStore"
import type { InitiateFastTrackPaymentDto, FastTrackTransaction, SplitMode } from "./types"
import { SPLIT_MODE_LABELS } from "./types"
import { formatMoney } from "@/utilities/currencyUtilities"
import { formatPaymentNumber } from "./formatters"
import { Building2, User, FileText, ChevronRight, Receipt } from "lucide-react"
import { useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"

export default function ConfirmPayment() {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.CONFIRM_VIEW)
  }, [])

  const provider = useFastTrackStore((s) => s.provider)
  const invoiceNumber = useFastTrackStore((s) => s.invoiceNumber)
  const invoiceAmountStr = useFastTrackStore((s) => s.invoiceAmount)
  const discountAmountStr = useFastTrackStore((s) => s.discountAmount)
  const patient = useFastTrackStore((s) => s.patient)
  const splits = useFastTrackStore((s) => s.splits)
  const setTransaction = useFastTrackStore((s) => s.setTransaction)
  const paymentSubmitted = useFastTrackStore((s) => s.paymentSubmitted)
  const setPaymentSubmitted = useFastTrackStore((s) => s.setPaymentSubmitted)

  const invoiceAmount = parseFloat(invoiceAmountStr) || 0
  const discountAmount = parseFloat(discountAmountStr) || 0
  const netAmount = invoiceAmount - discountAmount

  const handlePaymentSuccess = async () => {
    const txnId = crypto.randomUUID()
    const paymentModeTags = splits
      .map((s) => s.mode)
      .filter((m) => m !== "DISCOUNT") as SplitMode[]
    const now = new Date().toISOString()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    const paymentSplits = splits
      .filter((s) => s.mode !== "DISCOUNT")
      .map((s) => ({
        paymentSplitAmount: String(s.amount),
        wallet: { type: s.mode === "CAREFUND" ? "CASHBACK" : s.mode },
        ...(s.mode === "LOAN" ? { loan: { repaymentPeriodDays: s.repaymentPeriodDays } } : {}),
      }))

    const { error: insertError } = await supabase.from("payments").insert({
      id: txnId,
      user_id: authUser?.id,
      facility_name: provider?.facility?.name ?? "",
      facility_type: "HOSPITAL",
      amount: netAmount,
      currency: "KES",
      status: "COMPLETED",
      payment_splits: paymentSplits,
      user_info: {
        firstName: patient?.firstName ?? "",
        lastName: patient?.lastName ?? "",
      },
      created_at: now,
    })

    if (insertError) {
      toast({
        title: "Error",
        description: "Failed to save payment record. Please try again.",
        variant: "destructive",
      })
      return
    }

    const transaction: FastTrackTransaction = {
      id: txnId,
      providerId: provider?.id ?? 0,
      patientId: patient?.id ?? "",
      invoiceNumber,
      paymentNumber: provider?.paymentNumber ?? "",
      totalBillAmount: String(invoiceAmount),
      grossAmount: String(invoiceAmount),
      providerName: provider?.facility?.name ?? "",
      discountAmount: String(discountAmount),
      netAmount: String(netAmount),
      paymentModeTags,
      status: "SETTLED",
      createdAt: now,
      updatedAt: now,
      provider: {
        id: provider?.id ?? 0,
        name: provider?.facility?.name ?? "",
        address: "",
        POBox: null,
      },
      patient: {
        id: patient?.id ?? "",
        firstName: patient?.firstName ?? "",
        lastName: patient?.lastName ?? "",
        phoneNumber: patient?.phoneNumber ?? "",
      },
    }

    trackEvent(EVENTS.FAST_TRACK_PAYMENT.PAYMENT_COMPLETED, {
      payment_id: txnId,
      payment_point_id: provider?.id,
      facility_id: provider?.facility?.id,
      amount_paid: safeAmount(netAmount),
      currency: "KES",
      payment_method: paymentModeTags.join(","),
      discount_applied: safeAmount(discountAmount),
    })

    supabase.functions.invoke("generate-invoice-line-items", {
      body: { paymentId: txnId },
    }).catch(() => {})

    setTransaction(transaction)
    setPaymentSubmitted(true)

    toast({
      title: "Payment Submitted",
      description: `Payment of ${formatMoney(netAmount, "KES")} made successfully`,
    })
    navigate("/patients/fast-track/status", { replace: true })
  }

  const handlePaymentError = (error: any) => {
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.PAYMENT_FAILED, {
      payment_method: splits.map((s) => s.mode).join(","),
      error_code: error.response?.status?.toString(),
      error_type: error.response?.data?.errorType || "unknown",
      amount_attempted: safeAmount(invoiceAmountStr),
      facility_id: provider?.facility?.id,
    })

    const message =
      error.response?.data?.message || error.message || "Payment failed"
    toast({ title: "Error", description: message, variant: "destructive" })
  }

  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : ""

  const handleBeforeSubmit = (onValid: (data: any) => void) => {
    return async (e?: any) => {
      e?.preventDefault()

      if (!provider || !patient?.id || paymentSubmitted) return

      const DEFAULT_LOAN_REPAYMENT_DAYS = 31
      const loanSplit = splits.find((s) => s.mode === "LOAN")
      const repaymentDays =
        loanSplit?.repaymentPeriodDays != null
          ? Number(loanSplit.repaymentPeriodDays)
          : loanSplit
            ? DEFAULT_LOAN_REPAYMENT_DAYS
            : undefined
      const dto: InitiateFastTrackPaymentDto = {
        paymentNumber: provider.paymentNumber,
        amount: invoiceAmount,
        invoiceNumber,
        patientId: patient.id,
        splits: splits.map((s) => {
          const split: {
            mode: typeof s.mode
            amount: number
            repaymentPeriodDays?: number
          } = {
            mode: s.mode,
            amount: s.amount,
          }
          if (s.mode === "LOAN") {
            split.repaymentPeriodDays =
              s.repaymentPeriodDays != null
                ? Number(s.repaymentPeriodDays)
                : DEFAULT_LOAN_REPAYMENT_DAYS
          }
          return split
        }),
        discountAmount: discountAmount || 0,
        ...(repaymentDays != null && { repaymentPeriodDays: repaymentDays }),
      }

      trackEvent(EVENTS.FAST_TRACK_PAYMENT.AUTHORIZATION_ATTEMPT, {
        payment_method: splits.map((s) => s.mode).join(","),
        amount: safeAmount(invoiceAmountStr),
        payment_point: provider?.name,
        attempt_number: 1,
        auth_status: "pending",
      })

      onValid(dto)
    }
  }

  const { dueLater } = useMemo(() => {
    if (!splits) return { dueLater: 0 }
    let dueLater = 0
    splits.forEach((split) => {
      if (split.mode === "LOAN") {
        dueLater += split.amount
      }
    })
    return { dueLater }
  }, [splits])

  const loanSplit = useMemo(
    () => splits.find((s) => s.mode === "LOAN"),
    [splits]
  )

  const formattedRepaymentDateShort = useMemo(() => {
    if (!loanSplit?.repaymentPeriodDays) return ""
    const date = new Date(
      Date.now() + loanSplit.repaymentPeriodDays * 24 * 60 * 60 * 1000
    )
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  }, [loanSplit])

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Summary"
      pageTitle="Confirm Payment"
      description="Review the details below before submitting"
    >
      <div className="flex flex-col gap-5 px-1 pb-8">
        {/* Payment Details Card */}
        <div className="border border-border rounded-xl p-4 bg-card shadow-sm">
          <SectionTitle level={3} className="mb-4">
            Payment Details
          </SectionTitle>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">
                  I am paying at
                </span>
                <p className="text-sm text-muted-foreground">
                  {provider?.facility?.name || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {provider?.name || "—"} &middot;{" "}
                  {provider?.paymentNumber
                    ? formatPaymentNumber(provider.paymentNumber)
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">
                  I am paying for
                </span>
                <p className="text-sm text-muted-foreground">{patientName}</p>
                {patient?.phoneNumber && (
                  <p className="text-xs text-muted-foreground">
                    {patient.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Invoice
                </span>
                <p className="text-sm text-muted-foreground">
                  {invoiceNumber || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Total Bill Amount
                </span>
                {discountAmount > 0 ? (
                  <p className="text-sm text-muted-foreground ">
                    {" "}
                    <span className="text-sm text-muted-foreground line-through">
                      {" "}
                      {formatMoney(invoiceAmount, "KES") || "—"}{" "}
                    </span>{" "}
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      {formatMoney(netAmount, "KES") || "—"}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {" "}
                    {formatMoney(netAmount, "KES") || "—"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Source of Funds Card */}
        <div className="border border-border rounded-xl p-4 bg-card shadow-sm">
          <SectionTitle level={3} className="mb-3">
            Source of Funds
          </SectionTitle>

          <div className="flex flex-col gap-3">
            {splits.map((split, idx) =>
              split.mode !== "DISCOUNT" && split.mode !== "LOAN" ? (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">
                    {SPLIT_MODE_LABELS[split.mode]}
                  </span>
                  <span className="text-sm text-foreground font-medium">
                    {formatMoney(split.amount, "KES")}
                  </span>
                </div>
              ) : null
            )}
            {dueLater > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">
                  Medical Loan (Due by {formattedRepaymentDateShort})
                </span>
                <span className="text-sm text-foreground font-medium">
                  {formatMoney(dueLater, "KES")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Button */}
        <PatientPinPrompt
          drawer={{
            triggerLabel: (
              <span className="flex items-center gap-1">
                Pay {formatMoney(netAmount, "KES")}{" "}
                <ChevronRight className="w-4 h-4" />
              </span>
            ),
            title: "Confirm Payment",
            description: "Please enter your Jireh PIN to confirm payment",
            beforeSubmit: handleBeforeSubmit,
            triggerClassName:
              "bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-6 text-base font-semibold mt-2 flex justify-center items-center",
          }}
          form={{
            url: "/fast-track/initiate",
            method: "POST",
            submitButtonText: "Confirm & Pay",
            onSuccess: handlePaymentSuccess,
            onError: handlePaymentError,
          }}
        >
          <div className="p-5 border rounded-lg flex flex-col gap-3 ">
            <AmountContainer
              leftText="Paying To"
              rightText={provider?.facility?.name || "—"}
            />
            <AmountContainer
              leftText="Total Amount"
              rightText={formatMoney(netAmount, "KES")}
            />
            <AmountContainer leftText="For" rightText={patientName} />
          </div>
        </PatientPinPrompt>
      </div>
    </PatientPageWrapper>
  )
}
