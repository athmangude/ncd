import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"

const facility = { id: "fac-1", name: "Acme Clinic" }
const eligibility = { canReview: true, unreviewedPaymentId: "pay-1" }
const submitState = { isPending: false, mutateAsync: vi.fn() }

vi.mock("../useFacilityDetails", () => ({
  useFacilityDetails: () => ({
    data: facility,
    isLoading: false,
    isError: false,
  }),
}))
vi.mock("./useReviewEligibility", () => ({
  useReviewEligibility: () => ({ data: eligibility, isLoading: false }),
}))
vi.mock("./useSubmitFacilityReview", () => ({
  useSubmitFacilityReview: () => submitState,
}))
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: vi.fn() }) }))
vi.mock("@/hooks/useOffline", () => ({ useOffline: () => false }))
vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    DISCOVERY: {
      FACILITY_REVIEW_FORM_VIEW: "form_view",
      FACILITY_REVIEW_SCORE_SELECT: "score_select",
      FACILITY_REVIEW_SUBMIT_TAP: "submit_tap",
      FACILITY_REVIEW_SUBMIT_SUCCESS: "submit_success",
      FACILITY_REVIEW_SUBMIT_ERROR: "submit_error",
    },
  },
}))

import FacilityReviewFormPage from "./FacilityReviewFormPage"

const wrap = (ui: ReactNode) =>
  createElement(
    MemoryRouter,
    { initialEntries: ["/patients/facility/fac-1/review"] },
    ui
  )

describe("FacilityReviewFormPage (AppShell migration)", () => {
  beforeEach(() => {
    submitState.isPending = false
  })

  it("renders inside the shell with a pinned submit footer", () => {
    render(wrap(<FacilityReviewFormPage />))
    // AppShell provides the <main> frame.
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Add a review" })
    ).toBeInTheDocument()
  })

  it("wires the footer submit button to the form by id so it submits across the shell's DOM split", () => {
    render(wrap(<FacilityReviewFormPage />))
    const submit = screen.getByRole("button", { name: "Add a review" })
    // The button lives in the AppShell footer slot, outside the <form>, so it
    // must reference the form by id to submit it.
    expect(submit).toHaveAttribute("type", "submit")
    expect(submit).toHaveAttribute("form", "facility-review-form")
    const form = document.getElementById("facility-review-form")
    expect(form?.tagName).toBe("FORM")
  })

  it("disables submit until a score is selected, then enables it", () => {
    render(wrap(<FacilityReviewFormPage />))
    const submit = screen.getByRole("button", { name: "Add a review" })
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Score 10" }))
    expect(submit).not.toBeDisabled()
  })
})
