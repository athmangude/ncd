import { Button } from "@/components/Button"
import { Lock, Info, HandCoins, Check } from "lucide-react"
import { LoansCard } from "./LoansCard"
import { DashboardCTA } from "./DashboardCTA"
import { ProtectedResource } from "@/components/ProtectedResource"
import { MEMBER_LOAN_ROLES } from "../../../constants/userTypes"
import YourTreatments from "../../../components/YourTreatments"
import { useNavigate } from "react-router-dom"
import { trackEvent, EVENTS } from "@/analytics"

interface LoansTabContentProps {
  loans: any
  loanStats: any
  hasActiveMembership: boolean
  isFrozen?: boolean
  onUpgrade: () => void
  type: string
  isLoading?: boolean
}

export function LoansTabContent({
  loans,
  loanStats,
  hasActiveMembership,
  isFrozen = false,
  onUpgrade,
  type,
  isLoading,
}: LoansTabContentProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <LoansCard
        loans={loans}
        loanStats={loanStats}
        isLocked={!hasActiveMembership}
        isFrozen={isFrozen}
        onUpgrade={onUpgrade}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* How to raise my limit button — gated to loan-eligible roles so
            non-members never land on the "not authorized" page. */}
        <ProtectedResource userRole={type} allowedRoles={MEMBER_LOAN_ROLES}>
          <DashboardCTA
            icon={<Info className="w-8 h-8 text-primary" />}
            title="How to raise my limit"
            onClick={() =>
              navigate("/patients/financial-statements-with-credit-update")
            }
          />
        </ProtectedResource>

        <ProtectedResource userRole={type} allowedRoles={MEMBER_LOAN_ROLES}>
          <DashboardCTA
            icon={<HandCoins className="w-8 h-8 text-primary" />}
            title="Repay Loans"
            onClick={() => {
              try {
                trackEvent(EVENTS.LOAN_REPAYMENT.REPAY_CTA_TAP, {
                  loanCount: loans?.length ?? 0,
                })
              } catch {
                // Silent fail
              }
              navigate("/patients/loans/all-loans")
            }}
          />
        </ProtectedResource>
      </div>

      {!hasActiveMembership && (
        <Button
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 "
          onClick={onUpgrade}
        >
          <Lock className="w-4 h-4 mr-2" />
          Upgrade Now to Unlock
        </Button>
      )}
      {!hasActiveMembership && (
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="text-foreground mb-4">Unlock full financial limits</h3>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  Unlock Higher Loan Limits
                </p>
                <p className="text-sm text-muted-foreground">
                  Access to loans and financial utility.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  Pay hospital bills instantly
                </p>
                <p className="text-sm text-muted-foreground">
                  Settle medical bills directly.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  Flexible, interest-free terms
                </p>
                <p className="text-sm text-muted-foreground">
                  Repay comfortably with 0% interest.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <h3 className="text-foreground">Loan History</h3>
      </div>

      {loans?.length > 0 ? (
        <YourTreatments showTitle={false} loans={loans} />
      ) : (
        <div className="text-center py-10 text-muted-foreground bg-muted rounded-2xl border border-dashed border-border">
          <p className="font-medium">No loans yet</p>
          <p className="text-sm mt-1">Your loans history will appear here</p>
        </div>
      )}
    </div>
  )
}
