import { Button } from "@/components/Button"
import { Lock } from "lucide-react"
import { BalanceCard } from "./BalanceCard"
import { DiscountsSection, DiscountCode } from "./DiscountsSection"
import { PaymentRequestsSection } from "./PaymentRequestsSection"
import { SortedPayments } from "./SortedPayments"
import { CircleStatusSection } from "./CircleStatusSection"

interface PaymentsTabContentProps {
  loanStats: any
  hasActiveMembership: boolean
  isFrozen?: boolean
  onUpgrade: () => void
  onPayMedicalBill: () => void
  paymentRequests: any[]
  sortedPayments: any[]
  discounts?: DiscountCode[]
  isLoading?: boolean
}

export function PaymentsTabContent({
  loanStats,
  hasActiveMembership,
  isFrozen = false,
  onUpgrade,
  onPayMedicalBill,
  paymentRequests,
  sortedPayments,
  discounts = [],
  isLoading,
}: PaymentsTabContentProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <BalanceCard
        loanStats={loanStats}
        isLocked={!hasActiveMembership}
        isFrozen={isFrozen}
        onUpgrade={onUpgrade}
        isLoading={isLoading}
      />

      {!hasActiveMembership && (
        <Button variant="secondary" className="w-full" onClick={onUpgrade}>
          <Lock className="w-4 h-4 mr-2" />
          Upgrade Now to Unlock
        </Button>
      )}
      {!hasActiveMembership && (
        <Button className="w-full  " onClick={onPayMedicalBill}>
          Pay Medical Bill
        </Button>
      )}

      <DiscountsSection discounts={discounts} />

      <PaymentRequestsSection
        requests={paymentRequests}
        isLoading={isLoading}
      />

      <CircleStatusSection />

      <SortedPayments sortedPayments={sortedPayments} isLoading={isLoading} />
    </div>
  )
}
