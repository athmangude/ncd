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
  "/medication-timeline": "Care History",
  "/medication-cards": "Medication Cards",
  "/refill-schedule": "Medication & Test Schedule",
  "/education": "Health Education",
  "/medication-loan": "Medication Loan",
  "/assistant": "Care Assistant",
  "/test-results": "Test Results",
}

function resolvePageTitle(subPath: string): string {
  if (PAGE_TITLES[subPath]) return PAGE_TITLES[subPath]
  if (subPath.startsWith("/medication-cards/")) return "Medication Card"
  if (subPath.startsWith("/education/")) return "Lesson"
  return "Care Companion"
}

const CareCompanionIntake = lazy(() => import("./Intake/CareCompanionIntake"))
const CostTrackerPage = lazy(() => import("./CostTrackerPage"))
const EmergencyCardPage = lazy(() => import("./EmergencyCardPage"))
const MedicationTimelinePage = lazy(() => import("./MedicationTimelinePage"))
const MedicationCardsPage = lazy(() => import("./MedicationCardsPage"))
const RefillSchedulePage = lazy(() => import("./RefillSchedulePage"))
const EducationFeedPage = lazy(() => import("./EducationFeedPage"))
const MedicationLoanPage = lazy(() => import("./MedicationLoanPage"))
const AiAssistantPage = lazy(() => import("./AiAssistantPage"))
const MedicationCardDetailPage = lazy(() => import("./MedicationCardDetailPage"))
const EducationArticlePage = lazy(() => import("./EducationArticlePage"))
const TestResultsUploadPage = lazy(() => import("./TestResultsUploadPage"))

export default function CareCompanionWrapper() {
  const navigate = useNavigate()
  const location = useLocation()

  const subPath = location.pathname.replace(
    /^\/patients\/companion/,
    "",
  )
  const pageTitle = resolvePageTitle(subPath)

  const header = (
    <BackTitleHeader
      title={pageTitle}
      onBack={() => navigate(-1)}
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
              <RouteMetadata title="Care History">
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
            path="/medication-cards/:slug"
            element={
              <RouteMetadata title="Medication Card">
                <MedicationCardDetailPage />
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
            path="/education/:slug"
            element={
              <RouteMetadata title="Health Article">
                <EducationArticlePage />
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
            path="/assistant"
            element={
              <RouteMetadata title="Care Assistant">
                <AiAssistantPage />
              </RouteMetadata>
            }
          />
          <Route
            path="/test-results"
            element={
              <RouteMetadata title="Test Results">
                <TestResultsUploadPage />
              </RouteMetadata>
            }
          />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
