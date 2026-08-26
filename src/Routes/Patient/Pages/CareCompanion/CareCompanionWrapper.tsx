import { lazy, Suspense } from "react"
import { Route, Routes, useNavigate } from "react-router-dom"
import RouteMetadata from "@/components/RouteMetadata"
import AppShell from "@/Routes/AppShell"
import { BackTitleHeader } from "@/Routes/shell/headers"
import { DashboardTabFallback } from "@/Routes/Patient/Pages/Dashboard/components/DashboardTabFallback"

const CareCompanionIntake = lazy(() => import("./Intake/CareCompanionIntake"))
const CostTrackerPage = lazy(() => import("./CostTrackerPage"))
const EmergencyCardPage = lazy(() => import("./EmergencyCardPage"))
const MedicationTimelinePage = lazy(() => import("./MedicationTimelinePage"))
const MedicationCardsPage = lazy(() => import("./MedicationCardsPage"))
const RefillSchedulePage = lazy(() => import("./RefillSchedulePage"))
const EducationFeedPage = lazy(() => import("./EducationFeedPage"))
const PharmacyStockFinderPage = lazy(() => import("./PharmacyStockFinderPage"))
const MedicationLoanPage = lazy(() => import("./MedicationLoanPage"))
const AiAssistantPage = lazy(() => import("./AiAssistantPage"))
const NotificationFeedPage = lazy(
  () => import("./Notifications/NotificationFeedPage")
)

export default function CareCompanionWrapper() {
  const navigate = useNavigate()

  const header = (
    <BackTitleHeader
      title="Care Companion"
      onBack={() => navigate("/patients/care")}
    />
  )

  return (
    <AppShell header={header} footer={null}>
      <Suspense fallback={<DashboardTabFallback />}>
        <Routes>
          <Route
            path="/intake"
            element={
              <RouteMetadata title="Care Companion Intake">
                <CareCompanionIntake />
              </RouteMetadata>
            }
          />
          <Route
            path="/cost-tracker"
            element={
              <RouteMetadata title="Cost Tracker">
                <CostTrackerPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/emergency-card"
            element={
              <RouteMetadata title="Emergency Card">
                <EmergencyCardPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/medication-timeline"
            element={
              <RouteMetadata title="Medication Timeline">
                <MedicationTimelinePage />
              </RouteMetadata>
            }
          />
          <Route
            path="/medication-cards"
            element={
              <RouteMetadata title="Medication Cards">
                <MedicationCardsPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/refill-schedule"
            element={
              <RouteMetadata title="Refill Schedule">
                <RefillSchedulePage />
              </RouteMetadata>
            }
          />
          <Route
            path="/education"
            element={
              <RouteMetadata title="Health Education">
                <EducationFeedPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/pharmacy-stock"
            element={
              <RouteMetadata title="Pharmacy Stock Finder">
                <PharmacyStockFinderPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/medication-loan"
            element={
              <RouteMetadata title="Medication Loan">
                <MedicationLoanPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/notifications"
            element={
              <RouteMetadata title="Notifications">
                <NotificationFeedPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/assistant"
            element={
              <RouteMetadata title="Care Assistant">
                <AiAssistantPage />
              </RouteMetadata>
            }
          />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
