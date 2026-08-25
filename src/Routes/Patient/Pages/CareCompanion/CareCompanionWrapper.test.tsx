// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"

// ---------------------------------------------------------------------------
// Mocks — declared before importing the component under test
// ---------------------------------------------------------------------------

// Controlled return value for useCareCompanionProfile
const mockRefetch = vi.fn()
let profileReturn: {
  data: { intakeCompletedAt: string | null; skippedAt: string | null } | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
} = {
  data: undefined,
  isLoading: false,
  isError: false,
  refetch: mockRefetch,
}

vi.mock("./Intake/hooks/useCareCompanionProfile", () => ({
  useCareCompanionProfile: () => profileReturn,
}))

// Controlled return value for useCareCompanionStore
let storeReturn: { intakeCompleted: boolean } = { intakeCompleted: false }

vi.mock("./store/careCompanionStore", () => ({
  useCareCompanionStore: () => storeReturn,
}))

// Stub lazy-loaded page components — they are not under test here
vi.mock("./CareCompanionHome", () => ({
  default: () => <div data-testid="care-companion-home">Home</div>,
}))
vi.mock("./Intake/CareCompanionIntake", () => ({
  default: () => <div data-testid="care-companion-intake">Intake</div>,
}))
vi.mock("./CostTrackerPage", () => ({
  default: () => <div>CostTracker</div>,
}))
vi.mock("./EmergencyCardPage", () => ({
  default: () => <div>EmergencyCard</div>,
}))
vi.mock("./MedicationTimelinePage", () => ({
  default: () => <div>MedicationTimeline</div>,
}))
vi.mock("./MedicationCardsPage", () => ({
  default: () => <div>MedicationCards</div>,
}))
vi.mock("./RefillSchedulePage", () => ({
  default: () => <div>RefillSchedule</div>,
}))
vi.mock("./EducationFeedPage", () => ({
  default: () => <div>EducationFeed</div>,
}))
vi.mock("./PharmacyStockFinderPage", () => ({
  default: () => <div>PharmacyStock</div>,
}))
vi.mock("./MedicationLoanPage", () => ({
  default: () => <div>MedicationLoan</div>,
}))
vi.mock("./AiAssistantPage", () => ({
  default: () => <div>AiAssistant</div>,
}))

// Stub RouteMetadata — pass children through
vi.mock("@/components/RouteMetadata", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Stub DashboardTabFallback so we can detect the loading state
vi.mock(
  "@/Routes/Patient/Pages/Dashboard/components/DashboardTabFallback",
  () => ({
    DashboardTabFallback: () => (
      <div data-testid="dashboard-tab-fallback">Loading...</div>
    ),
  })
)

// Stub ErrorBlock so we can detect the error state and trigger retry
vi.mock("@/components/ErrorBlock", () => ({
  default: ({
    message,
    action,
  }: {
    message?: string
    action?: React.ReactNode
  }) => (
    <div data-testid="error-block">
      <span>{message}</span>
      {action}
    </div>
  ),
}))

// Stub Button so it renders a real <button>
vi.mock("@/components/Button", () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
}))

import CareCompanionWrapper from "./CareCompanionWrapper"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWrapper(initialPath = "/patients/care-companion") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/patients/care-companion/*"
          element={<CareCompanionWrapper />}
        />
      </Routes>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  profileReturn = {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  }
  storeReturn = { intakeCompleted: false }
})

describe("CareCompanionWrapper", () => {
  describe("loading state", () => {
    it("renders DashboardTabFallback while profile is loading", () => {
      profileReturn.isLoading = true
      renderWrapper()
      expect(screen.getByTestId("dashboard-tab-fallback")).toBeInTheDocument()
    })

    it("does NOT block the intake route with the loading guard even while loading", async () => {
      profileReturn.isLoading = true
      renderWrapper("/patients/care-companion/intake")
      // The loading guard (line 45) does not fire because isIntakeRoute is
      // true. The component falls through to <Suspense> which initially shows
      // DashboardTabFallback, but the mocked lazy import resolves immediately.
      // After resolution, the intake page renders.
      const intakePage = await screen.findByTestId("care-companion-intake")
      expect(intakePage).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("renders ErrorBlock with retry when the API fails and no cached profile", () => {
      profileReturn.isError = true
      renderWrapper()
      expect(screen.getByTestId("error-block")).toBeInTheDocument()
      expect(
        screen.getByText(
          "We couldn't load your care profile. Check your connection and try again."
        )
      ).toBeInTheDocument()
    })

    it("calls refetch when the retry button is clicked", () => {
      profileReturn.isError = true
      renderWrapper()
      fireEvent.click(screen.getByText("Try again"))
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it("does NOT show error state on the intake route", () => {
      profileReturn.isError = true
      renderWrapper("/patients/care-companion/intake")
      expect(screen.queryByTestId("error-block")).not.toBeInTheDocument()
    })

    it("does NOT show error state when Zustand intakeCompleted is true", () => {
      profileReturn.isError = true
      storeReturn = { intakeCompleted: true }
      renderWrapper()
      expect(screen.queryByTestId("error-block")).not.toBeInTheDocument()
    })
  })

  describe("redirect to intake", () => {
    it("redirects to intake when profile is null and not loading", () => {
      // data: undefined, isLoading: false, isError: false => redirect
      renderWrapper()
      // Navigate replace renders nothing visible in the test tree, but the
      // intake route content should NOT be present because Navigate replaces
      // outside the Routes tree. We verify by checking that neither the home
      // page nor the error/loading states are shown.
      expect(
        screen.queryByTestId("dashboard-tab-fallback")
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId("error-block")).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("care-companion-home")
      ).not.toBeInTheDocument()
    })

    it("does NOT redirect when on the intake route", () => {
      renderWrapper("/patients/care-companion/intake")
      expect(screen.getByTestId("care-companion-intake")).toBeInTheDocument()
    })
  })

  describe("profile gate bypass", () => {
    it("renders routes when intakeCompletedAt is set on the profile", () => {
      profileReturn.data = {
        intakeCompletedAt: "2025-01-01T00:00:00Z",
        skippedAt: null,
      }
      renderWrapper()
      expect(screen.getByTestId("care-companion-home")).toBeInTheDocument()
    })

    it("renders routes when skippedAt is set even if intakeCompletedAt is null", () => {
      profileReturn.data = {
        intakeCompletedAt: null,
        skippedAt: "2025-01-01T00:00:00Z",
      }
      renderWrapper()
      expect(screen.getByTestId("care-companion-home")).toBeInTheDocument()
    })

    it("renders routes when Zustand intakeCompleted is true even if API data is missing", () => {
      storeReturn = { intakeCompleted: true }
      renderWrapper()
      expect(screen.getByTestId("care-companion-home")).toBeInTheDocument()
    })
  })

  describe("intake route detection precision", () => {
    it("matches exactly /care-companion/intake", () => {
      renderWrapper("/patients/care-companion/intake")
      // Should pass through to routes (not redirect or error)
      expect(screen.getByTestId("care-companion-intake")).toBeInTheDocument()
    })
  })
})
