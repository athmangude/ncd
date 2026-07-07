import { useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import {
  User,
  Building2,
  Banknote,
  Pencil,
  Sparkles,
  ChevronRight,
  CreditCard,
  Loader2,
  LucideIcon,
} from "lucide-react"

import { Button } from "@/components/Button"
import PatientPageWrapper from "../../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import { useToast } from "@/hooks/useToast"
import {
  getFromLocalStorage,
  setToLocalStorage,
  removeFromLocalStorage,
} from "@/utilities/localStorage"
import { formatMoney } from "@/utilities/currencyUtilities"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
import invoiceIcon from "@/assets/icons/invoice.png"
import { CashbackBanner } from "@/components/CashbackBanner"

type PaymentInfo = {
  source: "verified_account" | "invoice_payment_info" | null
  type?: "MPTILL" | "MPAYBILL" | "mobile_money"
  accountNumber?: string
  tillNumber?: string
  businessNumber?: string
  paybillAccountNumber?: string
  recipientCode?: string
  bankCode?: string
  name?: string
}

interface ReviewItemProps {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  subValue?: string | null
  isValid: boolean
  onEdit: () => void
}

const ReviewItem = ({
  icon: Icon,
  label,
  value,
  subValue,
  isValid,
  onEdit,
}: ReviewItemProps) => (
  <div className="p-4 border-b border-border last:border-0 flex items-start gap-3">
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p
        className={`text-sm truncate ${isValid ? "text-muted-foreground" : "text-red-500"}`}
      >
        {value}
        {isValid && subValue && <span className="ml-1">({subValue})</span>}
      </p>
    </div>
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onEdit}
      aria-label={`Edit ${label}`}
    >
      <Pencil className="w-4 h-4" />
    </Button>
  </div>
)

const HeaderIcon = () => (
  <div className="relative">
    <img src={invoiceIcon} alt="" className={HEADER_ICON} />
    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
      <Sparkles className="w-3 h-3 text-white" />
    </div>
  </div>
)

const extractPaymentInfo = (data: any): PaymentInfo | null => {
  const paymentInfoData = data?.paymentInfo
  if (!paymentInfoData) return null

  const paymentType = paymentInfoData["payment-type"] || paymentInfoData["type"]
  const tillNumber =
    paymentInfoData["till-number"] || paymentInfoData["tillNumber"] || ""
  const businessNumber =
    paymentInfoData["business-number"] ||
    paymentInfoData["businessNumber"] ||
    ""
  const accountNumber =
    paymentInfoData["account-number"] || paymentInfoData["accountNumber"] || ""

  if (paymentType === "MPTILL") {
    return {
      source: "invoice_payment_info",
      type: "MPTILL",
      tillNumber,
    }
  }

  if (paymentType === "MPAYBILL" || paymentType === "MPPAYBILL") {
    return {
      source: "invoice_payment_info",
      type: "MPAYBILL",
      businessNumber,
      accountNumber,
    }
  }

  return null
}

const getPaymentInfoDisplay = (info: PaymentInfo | null) => {
  if (!info) return "Missing payment information"

  if (info.type === "MPTILL") {
    return info.tillNumber
      ? `Till Number: ${info.tillNumber}`
      : "Missing Till Number"
  }

  if (info.type === "MPAYBILL") {
    const parts = []
    parts.push(
      info.businessNumber
        ? `Business Number: ${info.businessNumber}`
        : "Missing Business Number"
    )
    parts.push(
      info.accountNumber
        ? `Account: ${info.accountNumber}`
        : "Missing Account Number"
    )
    return parts.join(", ")
  }

  return "Unknown Payment Method"
}

export default function PatientReviewInvoice() {
  const navigate = useNavigate()
  const { toast } = useToast()
  // Data Extraction
  const extractedData = useMemo(
    () => getFromLocalStorage(patientReviewInvoiceStorageKey) || {},
    []
  )

  const paymentInfo = useMemo(
    () => extractPaymentInfo(extractedData),
    [extractedData]
  )
  const isNetworkFacility =
    extractedData.kmpdcFacility?.facility?.facilityVerificationStatus ===
    "APPROVED"

  // Derived State
  const hasPatient = !!(
    extractedData.dependent ||
    (extractedData.patient?.firstName && extractedData.patient?.lastName)
  )
  const patientName = hasPatient
    ? extractedData.dependent
      ? `${extractedData.dependent.firstName} ${extractedData.dependent.lastName}`
      : `${extractedData.patient.firstName} ${extractedData.patient.lastName}`
    : "Missing patient information"
  const patientSubValue =
    hasPatient && extractedData.dependent
      ? extractedData.dependent.type
      : hasPatient && extractedData.patient?.status
        ? extractedData.patient.status
        : null

  const hasFacility = !!(
    extractedData.kmpdcFacility?.name || extractedData.facilityName
  )
  const facilityName = hasFacility
    ? extractedData.kmpdcFacility?.name || extractedData.facilityName
    : "Missing facility information"

  const hasBillAmount = !!extractedData.billAmount
  const billAmountFormatted = hasBillAmount
    ? formatMoney(extractedData.billAmount, "KES")
    : "Missing bill amount"

  const hasPaymentInfo = !!(
    paymentInfo &&
    ((paymentInfo.type === "MPTILL" && paymentInfo.tillNumber) ||
      (paymentInfo.type === "MPAYBILL" &&
        paymentInfo.businessNumber &&
        paymentInfo.accountNumber))
  )

  const isFormValid =
    hasPatient && hasFacility && hasBillAmount && hasPaymentInfo

  const amountValue = extractedData.billAmount || 0
  const cashbackAmount = formatMoney(amountValue * 0.05 || 0, "KES")

  // Side Effects
  useEffect(() => {
    if (paymentInfo) {
      const currentData =
        getFromLocalStorage(patientReviewInvoiceStorageKey) || {}
      if (
        JSON.stringify(currentData.selectedPaymentInfo) !==
        JSON.stringify(paymentInfo)
      ) {
        setToLocalStorage(patientReviewInvoiceStorageKey, {
          ...currentData,
          selectedPaymentInfo: paymentInfo,
        })
      }
    }
  }, [paymentInfo])

  // Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        dependentId: extractedData.dependent?.id,
        kmpdcFacilityId: extractedData.kmpdcFacility?.id,
        careProviderName:
          extractedData.kmpdcFacility?.name || extractedData.facilityName,
        billAmount: Math.round(extractedData.billAmount),
        invoiceFileId: extractedData.invoiceFile?.id,
        paymentInfo: paymentInfo
          ? {
              type: paymentInfo.type,
              tillNumber: paymentInfo.tillNumber,
              businessNumber: paymentInfo.businessNumber,
              accountNumber: paymentInfo.accountNumber,
              paybillAccountNumber: paymentInfo.paybillAccountNumber,
            }
          : null,
      }

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/payments/manual-review-request`,
        payload
      )
      return data
    },
    onSuccess: (data) => {
      if (data?.id) {
        setToLocalStorage("manualPaymentRequestId", data.id)
        const currentData =
          getFromLocalStorage(patientReviewInvoiceStorageKey) || {}
        const discountCode = currentData.discountCode
        const appliedDiscount = currentData.appliedDiscount
        removeFromLocalStorage(patientReviewInvoiceStorageKey)
        navigate("/patients/payment/request-payment/verification-pending", {
          state: [discountCode, appliedDiscount].some(Boolean)
            ? {
                discountCode: discountCode ?? undefined,
                appliedDiscount: appliedDiscount ?? undefined,
              }
            : undefined,
        })
      } else {
        navigate("/patients/payment/request-payment/verification-pending")
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      })
    },
  })

  // Handlers
  const handleEdit = (field: "patient" | "amount" | "provider" | "payment") => {
    const commonState = {
      patient: {
        name: patientName,
        id: extractedData.dependent?.id || extractedData.patient?.id,
      },
      careProvider: extractedData || extractedData.kmpdcFacility,
      fromReview: true,
    }

    switch (field) {
      case "patient":
        navigate("/patients/payment/request-payment/select-patient", {
          state: {
            patientId: extractedData.patient?.id || extractedData.dependent?.id,
          },
        })
        break
      case "amount":
        navigate("/patients/payment/request-payment/set-bill-amount", {
          state: {
            totalBillAmount: extractedData.billAmount,
            careProvider: extractedData || extractedData.kmpdcFacility,
            fromReview: true,
          },
        })
        break
      case "provider":
      case "payment":
        navigate("/patients/payment/request-payment/treatment-details", {
          state: commonState,
        })
        break
    }
  }

  return (
    <PatientPageWrapper
      variant="content"
      showHelp
      headerIcon={<HeaderIcon />}
      pageTitle="Review and confirm your information"
      footer={
        <div className="p-4 bg-card border-t border-border">
          <Button
            className={`w-full font-semibold py-6 rounded-xl flex items-center justify-center gap-2 text-lg ${
              isFormValid
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isFormValid}
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Choose how to pay
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <ReviewItem
            icon={User}
            label="I am paying for"
            value={patientName}
            subValue={patientSubValue}
            isValid={hasPatient}
            onEdit={() => handleEdit("patient")}
          />
          <ReviewItem
            icon={Building2}
            label="I am paying at"
            value={facilityName}
            isValid={hasFacility}
            onEdit={() => handleEdit("provider")}
          />
          <ReviewItem
            icon={Banknote}
            label="The total bill is"
            value={billAmountFormatted}
            isValid={hasBillAmount}
            onEdit={() => handleEdit("amount")}
          />
          <ReviewItem
            icon={CreditCard}
            label="Payment method"
            value={
              hasPaymentInfo
                ? getPaymentInfoDisplay(paymentInfo)
                : "Missing payment information"
            }
            isValid={hasPaymentInfo}
            onEdit={() => handleEdit("payment")}
          />
        </div>

        <CashbackBanner
          visible={isNetworkFacility}
          title="Pay the full bill via Jireh and earn!"
          description={`With a bill of ${billAmountFormatted}, you could earn up to ${cashbackAmount} cashback!`}
        />
      </div>
    </PatientPageWrapper>
  )
}
