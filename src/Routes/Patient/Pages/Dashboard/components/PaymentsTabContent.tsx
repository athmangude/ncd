import { Button } from "@/components/Button"
import { Lock } from "lucide-react"
import { BalanceCard } from "./BalanceCard"
import { DiscountsSection, DiscountCode } from "./DiscountsSection"
import { PaymentRequestsSection } from "./PaymentRequestsSection"
import { SortedPayments } from "./SortedPayments"
import { CircleStatusSection } from "./CircleStatusSection"
import { DashboardStagger, DashboardSection } from "./DashboardStagger"
import type { DashboardAnimationMode } from "./DashboardStagger"

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
  animationMode: DashboardAnimationMode
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
  animationMode,
}: PaymentsTabContentProps) {
  return (
    <DashboardStagger mode={animationMode} className="flex flex-col gap-6">
      <DashboardSection mode={animationMode}>
        <BalanceCard
          loanStats={loanStats}
          isLocked={!hasActiveMembership}
          isFrozen={isFrozen}
          onUpgrade={onUpgrade}
          isLoading={isLoading}
        />
      </DashboardSection>

      {!hasActiveMembership && (
        <DashboardSection mode={animationMode}>
          <Button variant="secondary" className="w-full" onClick={onUpgrade}>
            <Lock className="w-4 h-4 mr-2" />
            Upgrade Now to Unlock
          </Button>
        </DashboardSection>
      )}
      {!hasActiveMembership && (
        <DashboardSection mode={animationMode}>
          <Button className="w-full" onClick={onPayMedicalBill}>
            Pay Medical Bill
          </Button>
        </DashboardSection>
      )}

      <DashboardSection mode={animationMode}>
        <DiscountsSection discounts={discounts} />
      </DashboardSection>

      <DashboardSection mode={animationMode}>
        <PaymentRequestsSection
          requests={paymentRequests}
          isLoading={isLoading}
        />
      </DashboardSection>

      <DashboardSection mode={animationMode}>
        <CircleStatusSection />
      </DashboardSection>

      <DashboardSection mode={animationMode}>
        <SortedPayments sortedPayments={sortedPayments} isLoading={isLoading} />
      </DashboardSection>
    </DashboardStagger>
  )
}
