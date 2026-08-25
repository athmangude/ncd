import { lazy, Suspense } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import RouteMetadata from "@/components/RouteMetadata"
import ErrorBlock from "@/components/ErrorBlock"
import { Button } from "@/components/Button"
import { DashboardTabFallback } from "@/Routes/Patient/Pages/Dashboard/components/DashboardTabFallback"
import { useCareCompanionProfile } from "./Intake/hooks/useCareCompanionProfile"
import { useCareCompanionStore } from "./store/careCompanionStore"

const CareCompanionHome = lazy(() => import("./CareCompanionHome"))
const CareCompanionIntake = lazy(
  () => import("./Intake/CareCompanionIntake")
)
const CostTrackerPage = lazy(() => import("./CostTrackerPage"))
const EmergencyCardPage = lazy(() => import("./EmergencyCardPage"))
const MedicationTimelinePage = lazy(
  () => import("./MedicationTimelinePage")
)
const MedicationCardsPage = lazy(() => import("./MedicationCardsPage"))
const RefillSchedulePage = lazy(() => import("./RefillSchedulePage"))
const EducationFeedPage = lazy(() => import("./EducationFeedPage"))
const PharmacyStockFinderPage = lazy(
  () => import("./PharmacyStockFinderPage")
)
const MedicationLoanPage = lazy(() => import("./MedicationLoanPage"))
const AiAssistantPage = lazy(() => import("./AiAssistantPage"))
const NotificationFeedPage = lazy(
  () => import("./Notifications/NotificationFeedPage")
)

export default function CareCompanionWrapper() {
  const { intakeCompleted } = useCareCompanionStore()
  const { data: profile, isLoading, isError, refetch } =
    useCareCompanionProfile()
  const location = useLocation()

  // Exact match on the intake route — intentionally does not match sub-paths
  // like /care-companion/intake-review. If intake grows nested routes (e.g.
  // /intake/step-2), widen the match or switch to startsWith.
  const isIntakeRoute = location.pathname.endsWith("/care-companion/intake")

  // Profile is considered valid if intake was completed or explicitly skipped
  const hasProfile =
    intakeCompleted ||
    !!(profile?.intakeCompletedAt || profile?.skippedAt)

  // Show loading fallback while checking profile (unless already on intake)
  if (!hasProfile && isLoading && !isIntakeRoute) {
    return <DashboardTabFallback />
  }

  // When the profile API fails (network timeout, 5xx, etc.) and we have no
  // cached confirmation of intake completion, show a retry prompt instead of
  // silently redirecting the user back to intake. This is critical on 3G
  // connections where transient failures are common.
  if (!hasProfile && isError && !isIntakeRoute) {
    return (
      <ErrorBlock
        message="We couldn't load your care profile. Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  // Redirect to intake if no profile exists and not already on the intake route
  if (!hasProfile && !isLoading && !isIntakeRoute) {
    return <Navigate to="/patients/care-companion/intake" replace />
  }

  return (
    <Suspense fallback={<DashboardTabFallback />}>
      <Routes>
        <Route
          index
          element={
            <RouteMetadata title="Care Companion">
              <CareCompanionHome />
            </RouteMetadata>
          }
        />
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
  )
}
