import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import PatientPageWrapper from "@/Routes/Patient/Pages/PatientPageWrapper"
import { Amount } from "@/components/Amount"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Wallet, Smartphone, Percent, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import landline from "@/assets/icons/landline.png"

export const getPatientPaymentDetailsQueryKey = "getPatientPaymentDetails"

export default function PatientPaymentBreakdown() {
  const { id } = useParams()
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: [getPatientPaymentDetailsQueryKey, id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/payments/user/payment-details?paymentId=${id}`
      )
      return response.data
    },
  })

  if (query.isLoading) return <LoadingPage />
  if (query.isError) return <ErrorBlock />

  const {
    totalBillAmount,
    currency,
    paymentSplits,
    discountAmount = 0,
  } = query.data

  const currencyCode = currency?.code ?? "KES"

  // Identify discount split
  const discountSplit = paymentSplits?.find(
    (split: any) =>
      split.wallet?.type === "DISCOUNT" || split.wallet?.type === "DISCOUNTS"
  )

  const discountWalletAmount = discountSplit?.paymentSplitAmount || 0

  // Filter out discount split from sources
  const visibleSplits = paymentSplits?.filter(
    (split: any) =>
      split.wallet?.type !== "DISCOUNT" && split.wallet?.type !== "DISCOUNTS"
  )

  // Calculate Invoiced Bill (Gross)
  // Assuming totalBillAmount is the Net amount paid
  const invoicedBill =
    Number(totalBillAmount) - Number(discountWalletAmount || discountAmount)

  // Payment Sources Mapping
  const sources =
    visibleSplits?.map((split: any) => {
      let icon = <Wallet className="w-5 h-5 text-muted-foreground" />
      let label = split.wallet?.name || formatEnum(split.wallet?.type || "")
      let sublabel = ""

      switch (split.wallet?.type) {
        case "MPESA":
          icon = <Smartphone className="w-5 h-5 text-muted-foreground" />
          label = "MPESA"
          sublabel = split.phoneNumber || split.wallet.phoneNumber || ""
          break
        case "LOAN":
          icon = <Clock className="w-5 h-5 text-muted-foreground" />
          label = "Jireh Medical Loan"
          break
        case "CARE_FUND":
          icon = <Percent className="w-5 h-5 text-muted-foreground" />
          label = "Jireh Care Fund"
          break
        default:
          break
      }

      return {
        id: split.id,
        label,
        amount: split.paymentSplitAmount,
        icon,
        sublabel,
      }
    }) || []

  function formatEnum(str: string) {
    if (!str) return ""
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  return (
    <PatientPageWrapper
      title="How you paid"
      onBack={() => navigate(-1)}
      bodyPadding="none"
    >
      <div className="px-5 pb-2 flex flex-col items-center">
        <div className="mb-4">
          <div className="relative w-16 h-16">
            <img
              src={landline}
              alt="Invoice"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>

        <h1 className="mb-2">How you paid</h1>
        <p className="text-center text-muted-foreground text-sm max-w-xs mb-8">
          The payment methods used to cover the bill & the amounts deducted from
          each.
        </p>

        {/* Bill Details Section */}
        <div className="w-full mb-6">
          <p className="text-muted-foreground text-sm mb-3 pl-1">
            Bill details
          </p>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <DetailRow
              label="Invoiced bill"
              value={
                <Amount
                  value={invoicedBill}
                  currency={currencyCode}
                  size="sm"
                />
              }
            />
            {discountSplit && (
              <DetailRow
                label={discountSplit.wallet?.name || "Discount"}
                value={
                  <Amount
                    value={Number(discountSplit.paymentSplitAmount)}
                    currency={currencyCode}
                    size="sm"
                  />
                }
              />
            )}
            <DetailRow
              label="Paid with Jireh Health"
              value={
                <Amount
                  value={Number(totalBillAmount)}
                  currency={currencyCode}
                  size="sm"
                  weight="bold"
                />
              }
              isBold
              isLast
            />
          </div>
        </div>

        {/* Breakdown Section */}
        <div className="w-full">
          <p className="text-muted-foreground text-sm mb-3 pl-1">
            Breakdown of payment sources
          </p>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {sources.map((source: any, idx: number) => (
              <SourceRow
                key={source.id}
                icon={source.icon}
                label={source.label}
                sublabel={source.sublabel}
                amount={
                  <Amount
                    value={Number(source.amount)}
                    currency={currencyCode}
                    size="sm"
                    weight="bold"
                  />
                }
                isLast={idx === sources.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}

function DetailRow({
  label,
  value,
  isBold,
  isLast,
  isStrikethrough,
}: {
  label: string
  value: React.ReactNode
  isBold?: boolean
  isLast?: boolean
  isStrikethrough?: boolean
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center p-4",
        !isLast && "border-b border-border"
      )}
    >
      <span className={cn("text-foreground text-sm", isBold && "font-medium")}>
        {label}
      </span>
      <span
        className={cn(
          "text-foreground text-sm",
          isBold && "font-medium",
          isStrikethrough && "line-through text-muted-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}

function SourceRow({
  icon,
  label,
  sublabel,
  amount,
  isLast,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  amount: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-1",
        !isLast && "border-b border-border"
      )}
    >
      <div className="w-10 h-10  flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-foreground text-sm">{label}</p>
        {sublabel && (
          <p className="text-muted-foreground text-xs mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className="text-foreground">{amount}</div>
    </div>
  )
}
