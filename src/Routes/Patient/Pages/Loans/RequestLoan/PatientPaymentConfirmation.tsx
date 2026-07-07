import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../../PatientPageWrapper"
import { formatMoney } from "@/utilities/currencyUtilities"
import { useToast } from "@/hooks/useToast"
import useNextLoanApplicationStep from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import { DetailsNotSet } from "@/Routes/Patient/components/DetailsNotSet"
import cash from "@/assets/icons/cash.png"
import { useMemo, useEffect } from "react"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import PatientPinPrompt from "@/Routes/Patient/components/PatientPinPrompt"
import AmountContainer from "@/Routes/Patient/components/AmountContainer"
import { Building2, ChevronRight, User } from "lucide-react"
import { getFromLocalStorage, setToLocalStorage } from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import axios from "axios"

// --- Types ---
type WalletAllocation = {
  walletId: string
  amount: number
  enabled: boolean
  type: "MPESA" | "CARD" | "LOAN" | "CASHBACK" | "DISCOUNT"
  discountCode?: string
}

type PaymentSplitRequest = {
  walletId: string
  paymentAmount: number
  type?: "MPESA" | "CARD" | "LOAN" | "CASHBACK" | "DISCOUNT"
  discountCode?: string
}

type PaymentRequest = {
  totalBillAmount: number
  medicalInvoiceFileId: string
  paymentSplits: PaymentSplitRequest[]
  kmpdcFacilityId: string
  patientName: string
  repaymentPeriodDays?: number
  manualPaymentRequestId?: string
}

type PaymentSplitResult = {
  id: string
  splitAmount: string
  walletId: string
  walletType: "MPESA" | "CARD" | "LOAN" | "CASHBACK" | "DISCOUNT"
  walletBalance: string
  paymentRedirectUrl?: string
}

type PaymentResponse = {
  message: string
  paymentId: string
  paymentRedirectUrl?: string
  totalBillAmount: string
  status: "PENDING" | "COMPLETED" | "FAILED"
  paymentSplitResults: PaymentSplitResult[]
}

export default function PatientPaymentConfirmation() {
  const location = useLocation()
  const stateData = location.state
  const navigate = useNavigate()
  useNextLoanApplicationStep()
  const { toast } = useToast()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.PAYMENT.PAYMENT_CONFIRMATION_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const savedData = useMemo(
    () => getFromLocalStorage(patientReviewInvoiceStorageKey) || {},
    []
  )

  const data = useMemo(() => {
    // If stateData is complete, use it
    if (
      stateData &&
      stateData.careProvider &&
      stateData.patient &&
      stateData.fileId &&
      stateData.totalBillAmount &&
      stateData.walletAllocations
    ) {
      return stateData
    }

    // Helper to convert allocations object to array
    const getWalletAllocations = () => {
      if (stateData?.walletAllocations) return stateData.walletAllocations
      if (savedData.allocations) {
        return Object.values(savedData.allocations).map((alloc: any) => ({
          walletId: alloc.walletId,
          amount: alloc.amount,
          enabled: true,
          type: alloc.type,
          phoneNumber: alloc.phoneNumber, // preserve if exists
        }))
      }
      return []
    }

    const walletAllocations = getWalletAllocations()
    const manualPaymentRequestId = getFromLocalStorage("manualPaymentRequestId")

    // Determine repaymentPeriodDays
    let repaymentPeriodDays = stateData?.repaymentPeriodDays
    if (!repaymentPeriodDays && walletAllocations.length > 0) {
      const loanAlloc: any = walletAllocations.find(
        (a: any) => a.type === "LOAN"
      )
      if (loanAlloc && loanAlloc.repaymentPeriodDays) {
        repaymentPeriodDays = Number(loanAlloc.repaymentPeriodDays)
      }
    }

    return {
      careProvider:
        stateData?.careProvider ||
        savedData.kmpdcFacility ||
        savedData.oonFacility ||
        (savedData.invoiceFile
          ? { name: savedData.invoiceFile.careProviderName }
          : null),
      patient: stateData?.patient || savedData.dependent || savedData.patient,
      fileId: stateData?.fileId || savedData.invoiceFile?.id,
      totalBillAmount: stateData?.totalBillAmount || savedData.billAmount,
      originalBillAmount: stateData?.originalBillAmount || savedData.billAmount,
      discountAmount: stateData?.discountAmount || 0,
      discountCode: stateData?.discountCode || null,
      walletAllocations: walletAllocations,
      repaymentPeriodDays: repaymentPeriodDays,
      careFundDiscountAmount: stateData?.careFundDiscountAmount, // Preserve if exists
      manualPaymentRequestId: manualPaymentRequestId,
    }
  }, [stateData, savedData])

  const detailsPresent = () => {
    if (!data) return false
    if (!data.careProvider) return false
    if (!data.patient) return false
    if (!data.fileId) return false
    if (!data.totalBillAmount) return false
    if (!data.walletAllocations) return false
    return true
  }

  // --- Derived State for UI ---
  const careFundDiscountAmount = data?.careFundDiscountAmount || 0
  const newBillAmount = (data?.totalBillAmount || 0) - careFundDiscountAmount

  const repaymentDate = useMemo(() => {
    if (!data?.repaymentPeriodDays) return null
    const date = new Date(
      Date.now() + data.repaymentPeriodDays * 24 * 60 * 60 * 1000
    )
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }, [data?.repaymentPeriodDays])

  const formattedRepaymentDateShort = useMemo(() => {
    if (!data?.repaymentPeriodDays) return ""
    const date = new Date(
      Date.now() + data.repaymentPeriodDays * 24 * 60 * 60 * 1000
    )
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  }, [data?.repaymentPeriodDays])

  // Calculate "Pay Today" vs "Due Later"
  const { payToday, dueLater } = useMemo(() => {
    if (!data?.walletAllocations) return { payToday: 0, dueLater: 0 }

    let today = 0
    let later = 0

    data.walletAllocations.forEach((alloc: WalletAllocation) => {
      if (alloc.type === "LOAN") {
        later += alloc.amount
      } else {
        today += alloc.amount
      }
    })

    return { payToday: today, dueLater: later }
  }, [data?.walletAllocations])

  if (!detailsPresent()) {
    return (
      <PatientPageWrapper title="Confirm Payment">
        <DetailsNotSet title="It looks like your payment details have not been set" />
      </PatientPageWrapper>
    )
  }

  const handlePaymentSuccess = async (response: PaymentResponse) => {
    try {
      trackEvent(EVENTS.PAYMENT.PAYMENT_CONFIRMATION_SUCCESS, {
        paymentId: response.paymentId,
        totalBillAmount: safeAmount(response.totalBillAmount),
        status: response.status,
      })
    } catch {
      // Silent fail
    }

    const redirectSplit = response.paymentSplitResults.find(
      (split) => split.paymentRedirectUrl
    )
    // Save response to local storage as requested
    if (response) {
      setToLocalStorage("paymentId", response.paymentId)
      setToLocalStorage("paymentResponse", response)
    }

    toast({
      title: "Success",
      description: response.message || "Payment initiated successfully",
    })

    // Mark discount as redeemed if discount was used in payment splits
    const discountAllocation = data.walletAllocations.find(
      (alloc: WalletAllocation) => alloc.type === "DISCOUNT" && alloc.discountCode
    )

    if (discountAllocation && discountAllocation.discountCode) {
      try {
        const userId = usePatientAuthStore.getState().user?.id
        if (userId) {
          const orderAmount = data.originalBillAmount || data.totalBillAmount
          const applyPayload: Record<string, unknown> = {
            code: discountAllocation.discountCode,
            orderAmount: orderAmount,
            userId: userId,
          }
          const facilityId =
            data.careProvider?.facility?.id ??
            data.careProvider?.facilityId ??
            null
          if (facilityId != null) {
            applyPayload.healthcareFacilityId = facilityId
          }

          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/discount-codes/apply`,
            applyPayload,
            {
              withCredentials: true,
            }
          )
          // Discount redemption is handled silently - no need to show toast
        }
      } catch (error: any) {
        // Log error but don't block the payment success flow
        // The payment was successful, so we don't want to show an error to the user
        console.error("Failed to mark discount as redeemed:", error)
      }
    }

    const handleRedirect = (redirectUrl?: string) => {
      if (redirectUrl) {
        window.location.assign(redirectUrl)
      } else {
        navigate(`/patients/payment-status?paymentId=${response.paymentId}`)
      }
    }

    if (response.paymentRedirectUrl) {
      handleRedirect(response.paymentRedirectUrl)
      return
    }

    if (redirectSplit?.paymentRedirectUrl) {
      handleRedirect(redirectSplit.paymentRedirectUrl)
      return
    }

    handleRedirect()
  }

  const handlePaymentError = (error: any) => {
    try {
      trackEvent(EVENTS.PAYMENT.PAYMENT_CONFIRMATION_ERROR, {
        errorMessage: error?.response?.data?.message || error?.message,
      })
    } catch {
      // Silent fail
    }

    toast({
      title: "Error",
      description: error.response?.data?.message || error.message,
      variant: "destructive",
    })
  }

  const handleBeforeSubmit = (onValid: (data: any) => void) => {
    return async (e?: any) => {
      e?.preventDefault()

      try {
        trackEvent(EVENTS.PAYMENT.PAYMENT_CONFIRMATION_SUBMIT, {
          totalBillAmount: safeAmount(data.totalBillAmount),
          walletCount: data.walletAllocations?.length,
        })
      } catch {
        // Silent fail
      }

      const paymentRequest: PaymentRequest = {
        totalBillAmount: data.originalBillAmount || data.totalBillAmount,
        medicalInvoiceFileId: data.fileId,
        paymentSplits: data.walletAllocations.map(
          (allocation: WalletAllocation) => {
            // For discount allocations, ensure walletId and discountCode are included
            if (allocation.type === "DISCOUNT") {
              return {
                walletId: allocation.walletId, // e.g., "discount-HOLIDAY2025"
                paymentAmount: allocation.amount,
                type: allocation.type,
                discountCode: allocation.discountCode, // e.g., "HOLIDAY2025"
              }
            }
            // For regular wallet allocations
            return {
              walletId: allocation.walletId,
              paymentAmount: allocation.amount,
              type: allocation.type,
              // discountCode is optional for non-discount types
              ...(allocation.discountCode && { discountCode: allocation.discountCode }),
            }
          }
        ),
        kmpdcFacilityId: data.careProvider.id,
        patientName:
          data.patient.name ||
          data.patient.firstName + " " + data.patient.lastName,
        repaymentPeriodDays: data.repaymentPeriodDays,
        manualPaymentRequestId: data.manualPaymentRequestId,
      }

      onValid(paymentRequest)
    }
  }

  return (
    <PatientPageWrapper title="Summary">
      <div className="flex flex-col px-1 pb-8">
        {/* Top Icon & Title */}
        <div className="flex flex-col items-center justify-center mb-6">
          <img
            src={cash}
            alt="cash"
            className="w-[50px] mb-3"
            aria-hidden="true"
          />
          <h2 className="text-black">Confirm payment</h2>
        </div>

        <div className="flex flex-col gap-5">
          {/* Card 1: Treatment Details */}
          <div className="border border-border rounded-xl p-4 bg-white shadow-sm">
            <h3 className="text-muted-foreground mb-4">Treatment details</h3>

            <div className="flex flex-col gap-4">
              {/* Row 1: Paying For */}
              <div className="flex items-start gap-3">
                <User className="w-6 h-6 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    I am paying for
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {data.patient.name ||
                      `${data.patient.firstName} ${data.patient.lastName} (${data.patient?.type || data.dependent?.type || "myself"})`}
                  </span>
                </div>
              </div>

              {/* Row 2: Paying At */}
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    I am paying at
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {data.careProvider.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Source of Funds */}
          <div className="border border-border rounded-xl p-4 bg-white shadow-sm">
            <h3 className="text-muted-foreground mb-3">Source of funds</h3>

            <div className="flex flex-col gap-3">
              {data.walletAllocations.map((allocation: WalletAllocation) => (
                <div
                  key={allocation.walletId}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-foreground">
                    {allocation.type === "MPESA"
                      ? "MPESA"
                      : allocation.type === "CARD"
                        ? "Credit or debit card"
                        : allocation.type === "CASHBACK"
                          ? "Cashback"
                          : allocation.type === "LOAN"
                            ? "Jireh Medical Loan"
                            : allocation.type}
                  </span>
                  <span className="text-sm text-foreground font-medium">
                    {formatMoney(allocation.amount, "KES")}
                  </span>
                </div>
              ))}

              {repaymentDate && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Repayment date</span>
                  <span>{repaymentDate}</span>
                </div>
              )}

              {/* Divider */}
              <div
                className="h-px w-full bg-muted my-1"
                aria-hidden="true"
              />

              {/* Total Bill */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-black">Total Bill</span>
                <span className="font-bold text-sm text-black">
                  {formatMoney(newBillAmount, "KES")}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Footer Text */}
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground">You pay today</span>
              <span className="text-sm text-foreground font-medium">
                {formatMoney(payToday, "KES")}
              </span>
            </div>
            {dueLater > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">
                  Due by {formattedRepaymentDateShort}
                </span>
                <span className="text-sm text-foreground font-medium">
                  {formatMoney(dueLater, "KES")}
                </span>
              </div>
            )}
          </div>

          {/* Action Button - Replaced with PatientPinPrompt */}
          <PatientPinPrompt
            drawer={{
              triggerLabel: (
                <span className="flex items-center gap-1">
                  Pay {formatMoney(newBillAmount, "KES")} <ChevronRight />
                </span>
              ),
              title: "Confirm Payment",
              description: "Please enter your Jireh PIN to confirm payment",
              beforeSubmit: handleBeforeSubmit,
              triggerClassName:
                "bg-[#A020F0] hover:bg-[#8a1bce] text-white rounded-lg py-6 text-base font-semibold mt-2 flex justify-center items-center",
            }}
            form={{
              url: "/payments/user/initiate-multi-payment",
              method: "POST",
              submitButtonText: "Confirm & Pay",
              onSuccess: handlePaymentSuccess,
              onError: handlePaymentError,
            }}
          >
            <div className="p-5 border rounded-lg flex flex-col gap-3">
              <AmountContainer
                leftText="Paying To"
                rightText={data.careProvider.name}
              />
              <AmountContainer
                leftText="Total Amount"
                rightText={formatMoney(newBillAmount, "KES")}
              />
              <AmountContainer
                leftText="For"
                rightText={
                  data.patient.name ||
                  `${data.patient.firstName} ${data.patient.lastName}`
                }
              />
            </div>
          </PatientPinPrompt>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
