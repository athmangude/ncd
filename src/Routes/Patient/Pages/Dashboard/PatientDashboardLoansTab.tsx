import { TabsContent } from "@/components/Tabs"
import { cn } from "@/lib/utils"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useState, useEffect, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { getFirstIncompleteStep } from "../../hooks/useNextOnboardingStep"
import { KYC_START_URL } from "../../hooks/useNextKYCStep"
import { AlertCard } from "../../components/CallToActions"

import { DashboardSearch } from "./components/DashboardSearch"
import { DashboardTabs } from "./components/DashboardTabs"
import { PaymentsTabContent } from "./components/PaymentsTabContent"
import { LoansTabContent } from "./components/LoansTabContent"
import { CashbackTabContent } from "./components/CashbackTabContent"
import { DashboardStickyFooter } from "./components/DashboardStickyFooter"
import { DashboardSkeleton } from "./components/DashboardSkeleton"
import { usePatientDashboardData } from "./hooks/usePatientDashboardData"
import { useDashboardFirstLoad } from "./hooks/useDashboardFirstLoad"
import { useFastTrackStore } from "../FastTrack/useFastTrackStore"
import {
  tabContentSwitchVariants,
  tabContentSwitchTransition,
} from "./animation"

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

  const [activeTab, setActiveTab] = useState<"payments" | "loans" | "cashback">(
    location.state?.subTab || "payments"
  )

  useEffect(() => {
    if (location.state?.subTab) {
      setActiveTab(location.state.subTab)
    }
  }, [location.state])

  const {
    dashboardAlert,
    loanStats,
    paymentRequests,
    discounts,
    isLoading,
    loans,
    payments,
  } = usePatientDashboardData(activeTab)

  const sortedPayments = useMemo(
    () =>
      payments
        ? [...payments].sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        : [],
    [payments]
  )

  const { showSkeleton, mode: animationMode } = useDashboardFirstLoad(
    !!isLoading,
    loanStats != null
  )

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

  // The DashboardStickyFooter (fixed just above the tab bar) shows in these
  // states; when it does, reserve its height so content clears it. The tab-bar
  // clearance itself is owned once by DashboardTabContent's `.pb-tabbar`.
  const showsStickyFooter =
    hasActiveMembership || (activeTab === "cashback" && !hasActiveMembership)

  return (
    <TabsContent
      value="home"
      className={cn(
        "flex flex-col w-full gap-2 [&::-webkit-scrollbar]:hidden",
        showsStickyFooter && "pb-tabbar-cta"
      )}
    >
      <DashboardSearch />

      {dashboardAlert && <AlertCard alert={dashboardAlert} />}

      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {showSkeleton ? (
        <DashboardSkeleton showHeader={false} sections={4} />
      ) : (
        <SubTabSwitch activeTab={activeTab}>
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
              animationMode={animationMode}
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
              animationMode={animationMode}
            />
          )}

          {activeTab === "cashback" && (
            <CashbackTabContent animationMode={animationMode} />
          )}
        </SubTabSwitch>
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

/**
 * Animates the payments/loans/cashback sub-tab switch with the same snappy
 * transition DashboardTabContent uses for the top-level dashboard tabs, so
 * every tab switch in the app — top-level or nested — feels identical.
 */
function SubTabSwitch({
  activeTab,
  children,
}: {
  activeTab: string
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeTab}
        variants={tabContentSwitchVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={tabContentSwitchTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
