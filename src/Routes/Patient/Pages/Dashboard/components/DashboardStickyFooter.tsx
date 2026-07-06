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

export function DashboardStickyFooter({ 
  hasActiveMembership, 
  activeTab, 
  canPayMedicalBill, 
  onPayMedicalBill 
}: DashboardStickyFooterProps) {
  const navigate = useNavigate()

  if (hasActiveMembership) {
    return (
      <div className="fixed bottom-[64px] left-0 right-0 px-4 pt-4 pb-8 bg-card border-t border-border z-10 max-w-md mx-auto">
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
      <div className="fixed bottom-[64px] left-0 right-0 px-4 pt-4 pb-8 bg-card border-t border-border z-10 max-w-md mx-auto">
        <div className="max-w-md mx-auto w-full flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-full">
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Upgrade Now to unlock up to Ksh 6,000 loan limit
            </p>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={() => navigate(KYC_START_URL)}
          >
            Upgrade Now to Unlock
          </Button>
        </div>
      </div>
    )
  }

  return null
}
