import { Button } from "@/components/Button"
import { Lock } from "lucide-react"
import { KYC_START_URL } from "../../../hooks/useNextKYCStep"
import { useNavigate } from "react-router-dom"

interface DashboardStickyFooterProps {
  hasActiveMembership: boolean
  activeTab: "payments" | "loans" | "cashback"
  canPayMedicalBill: boolean
  onPayMedicalBill: () => void
}

// Pinned home-tab action bar. It sits flush on top of the fixed curved tab
// bar rather than guessing a magic `bottom-[64px]`: the offset is
// `var(--tabbar-h)` (the tab bar's real visible height incl. safe-area),
// declared once in index.css, so the two stay aligned if the tab bar changes.
// The tab bar owns the bottom safe-area inset, so this bar needs none.
const BAR_CLASS =
  "fixed bottom-[var(--tabbar-h)] left-0 right-0 z-10 max-w-md mx-auto " +
  "bg-card border-t border-border px-4 py-4"

export function DashboardStickyFooter({
  hasActiveMembership,
  activeTab,
  canPayMedicalBill,
  onPayMedicalBill,
}: DashboardStickyFooterProps) {
  const navigate = useNavigate()

  if (hasActiveMembership) {
    return (
      <div className={BAR_CLASS}>
        <Button
          size="lg"
          className="w-full"
          onClick={onPayMedicalBill}
          disabled={!canPayMedicalBill}
        >
          Pay Medical Bill
        </Button>
      </div>
    )
  }

  if (activeTab === "cashback" && !hasActiveMembership) {
    return (
      <div className={BAR_CLASS}>
        <div className="max-w-md mx-auto w-full flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-full">
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Upgrade Now to unlock up to Ksh 6,000 loan limit
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate(KYC_START_URL)}>
            Upgrade Now to Unlock
          </Button>
        </div>
      </div>
    )
  }

  return null
}
