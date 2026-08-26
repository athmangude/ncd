import { lazy, Suspense } from "react"
import { Route, Routes, useNavigate, useLocation } from "react-router-dom"
import RouteMetadata from "@/components/RouteMetadata"
import AppShell from "@/Routes/AppShell"
import { BackTitleHeader } from "@/Routes/shell/headers"
import { DashboardTabFallback } from "@/Routes/Patient/Pages/Dashboard/components/DashboardTabFallback"

const PAGE_TITLES: Record<string, string> = {
  "/intake": "Health Profile",
  "/cost-tracker": "Cost Tracker",
  "/emergency-card": "Emergency Card",
  "/medication-timeline": "Medication Timeline",
  "/medication-cards": "Medication Cards",
  "/refill-schedule": "Medication & Test Schedule",
  "/education": "Health Education",
  "/pharmacy-stock": "Pharmacy Stock Finder",
  "/medication-loan": "Medication Loan",
  "/notifications": "Notifications",
  "/assistant": "Care Assistant",
}

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
  const location = useLocation()

  const subPath = location.pathname.replace(
    /^\/patients\/companion/,
    "",
  )
  const pageTitle = PAGE_TITLES[subPath] ?? "Care Companion"

  const header = (
    <BackTitleHeader
      title={pageTitle}
      onBack={() => navigate("/patients/companion")}
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
              <RouteMetadata title="Medication & Test Schedule">
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
