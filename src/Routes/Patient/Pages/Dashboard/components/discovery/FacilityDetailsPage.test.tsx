import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"

const facility = {
  id: "fac-1",
  name: "Acme Clinic",
  latitude: "-1.29",
  longitude: "36.82",
  verificationStatus: "APPROVED",
  isOnboarded: true,
}

vi.mock("./facility-details/useFacilityDetails", () => ({
  useFacilityDetails: () => ({
    data: facility,
    isLoading: false,
    isError: false,
  }),
}))
vi.mock("./facility-details/useDriveTime", () => ({
  useDriveTime: () => ({ data: 12, isLoading: false }),
}))
vi.mock("./facility-details/reviews/useFacilityReviews", () => ({
  useFacilityReviews: () => ({ data: undefined, isLoading: false }),
}))
vi.mock("./facility-details/reviews/useReviewEligibility", () => ({
  useReviewEligibility: () => ({ data: { canReview: true }, isLoading: false }),
}))
vi.mock("./facility-details/AboutTab", () => ({
  AboutTab: () => createElement("div", null, "about-tab"),
}))
vi.mock("./facility-details/ReviewsTab", () => ({
  ReviewsTab: () => createElement("div", null, "reviews-tab"),
}))
vi.mock("./facility-details/MyActivityTab", () => ({
  MyActivityTab: () => createElement("div", null, "activity-tab"),
}))
vi.mock("./facility-details/reviews/ReviewGateHelperText", () => ({
  ReviewGateHelperText: () => null,
}))
vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: () => ({}),
}))
// The screen now renders the real PatientPageWrapper, whose journey stepper
// reads ONBOARDING_STEP_CONFIG from this hook — so the mock must provide it
// (empty config = no stepper match) alongside the getFirstIncompleteStep stub.
vi.mock("@/Routes/Patient/hooks/useNextOnboardingStep", () => ({
  getFirstIncompleteStep: () => null,
  ONBOARDING_STEP_CONFIG: [],
  ONBOARDING_STEPS: [],
}))
vi.mock("@/hooks/useOffline", () => ({ useOffline: () => false }))
vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    DISCOVERY: {
      FACILITY_DETAILS_VIEW: "view",
      FACILITY_REVIEW_GATE_BLOCKED: "blocked",
      FACILITY_DETAILS_TAB_CHANGE: "tab",
      FACILITY_DETAILS_GET_DIRECTIONS: "dir",
      FACILITY_DETAILS_PAY_HERE: "pay",
      FACILITY_DETAILS_ADD_REVIEW: "add",
    },
  },
}))

import FacilityDetailsPage from "./FacilityDetailsPage"

const wrap = (ui: ReactNode) =>
  createElement(
    MemoryRouter,
    { initialEntries: ["/patients/facility/fac-1"] },
    ui
  )

describe("FacilityDetailsPage (AppShell migration)", () => {
  it("renders the facility inside the shell with a pinned action footer", () => {
    render(wrap(<FacilityDetailsPage />))
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Acme Clinic" })
    ).toBeInTheDocument()
    // The About tab's footer actions are pinned in the AppShell footer slot.
    expect(
      screen.getByRole("button", { name: "Get directions" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pay here" })).toBeInTheDocument()
  })
})
