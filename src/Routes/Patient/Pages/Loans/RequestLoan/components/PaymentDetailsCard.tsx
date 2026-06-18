import AmountContainer from "../../../../components/AmountContainer"
import { formatMoney } from "@/utilities/currencyUtilities"

interface PaymentDetails {
  facilityName: string
  patientName: string
  billAmount: number
  currency: string
}

interface PaymentDetailsCardProps {
  paymentDetails: PaymentDetails
  showTitle?: boolean
  compact?: boolean
}

export default function PaymentDetailsCard({
  paymentDetails,
  showTitle = true,
  compact = false,
}: PaymentDetailsCardProps) {
  const containerClassName = compact
    ? "bg-neutral-50 rounded-lg p-4 space-y-2"
    : "w-full max-w-sm bg-white border rounded-lg p-4 space-y-3"

  const titleClassName = compact ? "text-sm font-semibold text-neutral-900 mb-2" : "text-sm font-semibold text-neutral-900 mb-3"
  const amountClassName = compact ? "text-sm" : undefined

  return (
    <div className={containerClassName}>
      {showTitle && (
        <h3 className={titleClassName}>
          {compact ? "Request Details" : "Payment Details"}
        </h3>
      )}
      <div className={compact ? "space-y-1.5" : "space-y-3"}>
        <AmountContainer
          leftText="Facility:"
          rightText={paymentDetails.facilityName}
          leftClassName={amountClassName}
          rightClassName={amountClassName}
        />
        <AmountContainer
          leftText="Patient:"
          rightText={paymentDetails.patientName}
          leftClassName={amountClassName}
          rightClassName={amountClassName}
        />
        <AmountContainer
          leftText="Amount:"
          rightText={formatMoney(paymentDetails.billAmount, paymentDetails.currency)}
          leftClassName={amountClassName}
          rightClassName={amountClassName}
        />
      </div>
    </div>
  )
}
