import { TabsContent } from "@/components/Tabs"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useState, useEffect, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { getFirstIncompleteStep } from "../../hooks/useNextOnboardingStep"
import { KYC_START_URL } from "../../hooks/useNextKYCStep"
import { AlertCard } from "../../components/CallToActions" 

import { DashboardSearch } from "./components/DashboardSearch"
import { DashboardTabs } from "./components/DashboardTabs"
import { PaymentsTabContent } from "./components/PaymentsTabContent"
import { LoansTabContent } from "./components/LoansTabContent"
import { CashbackTabContent } from "./components/CashbackTabContent"
import { DashboardStickyFooter } from "./components/DashboardStickyFooter"
import { usePatientDashboardData } from "./hooks/usePatientDashboardData"
import { useFastTrackStore } from "../FastTrack/useFastTrackStore"

export default function PatientDashboardLoansTab() {
  const user = usePatientAuthStore((state: any) => state.user) || {}
  const navigate = useNavigate()
  const location = useLocation()

  const { canPayMedicalBill, hasActiveMembership, type } = user

  // Borrowing is "frozen" (cracked-glass overlay) only when the account/circle
  // has been frozen — e.g. a default. Not having unlocked borrowing yet is a
  // separate, non-broken state (handled as the desaturated card).
  const isFrozen =
    user.patientCircle?.isFrozen === true ||
    user.patientCircle?.frozenAt != null

  const [activeTab, setActiveTab] = useState<"payments" | "loans" | "cashback">(location.state?.subTab || "payments")

  useEffect(() => {
    if (location.state?.subTab) {
      setActiveTab(location.state.subTab)
    }
  }, [location.state])

  const { dashboardAlert, loanStats, paymentRequests, discounts, isLoading, loans, payments } = usePatientDashboardData(activeTab)

  const sortedPayments = useMemo(() => payments ? [...payments].sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [], [payments])

  const handlePayMedicalBill = () => {
    const nextIncompleteStep = getFirstIncompleteStep(user)

    if (nextIncompleteStep) {
      navigate("/patients/complete-profile", {
        state: {
          onboardingRedirectLink: nextIncompleteStep,
          fromPayMedicalBill: true,
        },
      })
      return
    }

    // Reset any stale state from a previous fast track session before entering.
    useFastTrackStore.getState().reset()
    navigate("/patients/fast-track")
  }

  const handleUpgrade = () => {
    navigate(KYC_START_URL)
  }

  return (
    <TabsContent value="home" className="flex flex-col w-full gap-5  [&::-webkit-scrollbar]:hidden pb-52">

      <DashboardSearch />

      {dashboardAlert && <AlertCard alert={dashboardAlert} />}

      <DashboardTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {activeTab === "payments" && (
        <PaymentsTabContent
          loanStats={loanStats}
          hasActiveMembership={hasActiveMembership}
          isFrozen={isFrozen}
          onUpgrade={handleUpgrade}
          onPayMedicalBill={handlePayMedicalBill}
          paymentRequests={paymentRequests}
          sortedPayments={sortedPayments}
          discounts={discounts}
          isLoading={isLoading}
        />
      )}

      {activeTab === "loans" && (
        <LoansTabContent
          loans={loans}
          loanStats={loanStats}
          hasActiveMembership={hasActiveMembership}
          isFrozen={isFrozen}
          onUpgrade={handleUpgrade}
          type={type}
          isLoading={isLoading}
        />
      )}

      {activeTab === "cashback" && (
        <CashbackTabContent />
      )}

      <DashboardStickyFooter 
        hasActiveMembership={hasActiveMembership}
        activeTab={activeTab}
        canPayMedicalBill={canPayMedicalBill}
        onPayMedicalBill={handlePayMedicalBill}
      />

    </TabsContent>
  )
}
