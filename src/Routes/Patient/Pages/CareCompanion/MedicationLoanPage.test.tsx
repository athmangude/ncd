// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const approvedData = {
  isPreApproved: true,
  preApprovalDetails: {
    maxAmount: "5500",
    medications: [
      { name: "Metformin 500mg", estimatedCost: "2400" },
      { name: "Amlodipine 5mg", estimatedCost: "1800" },
      { name: "Aspirin 75mg", estimatedCost: "900" },
    ],
    targetPharmacy: { id: 103, name: "City Chemist Mombasa" },
    reason:
      "Based on your 8-month purchase history and consistent Jireh Care Saver activity, you are pre-approved for a medication loan.",
    expiresAt: "2026-09-30T23:59:59Z",
  },
}

const notEligibleData = {
  isPreApproved: false,
  preApprovalDetails: null,
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUsePreApproval = vi.fn((): {
  data: typeof approvedData | typeof notEligibleData | null | undefined
  isLoading: boolean
  error: Error | null
} => ({
  data: approvedData,
  isLoading: false,
  error: null,
}))

vi.mock("./hooks/useMedicationLoanPreApproval", () => ({
  useMedicationLoanPreApproval: () => mockUsePreApproval(),
}))

const mockTrackEvent = vi.fn()
vi.mock("@/analytics", () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  EVENTS: {
    CARE_COMPANION: {
      MEDICATION_LOAN: {
        VIEW: "CARE_COMPANION:MedicationLoan:view",
        PRE_APPROVAL_VIEW: "CARE_COMPANION:MedicationLoan:pre-approval-view",
        ACCEPT_TAP: "CARE_COMPANION:MedicationLoan:accept-tap",
        DECLINE_TAP: "CARE_COMPANION:MedicationLoan:decline-tap",
      },
    },
  },
}))

// Mock framer-motion to avoid animation timing issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import MedicationLoanPage from "./MedicationLoanPage"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrap(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MedicationLoanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePreApproval.mockReturnValue({
      data: approvedData,
      isLoading: false,
      error: null,
    })
  })

  describe("loading state", () => {
    it("shows a loading spinner when data is loading", () => {
      mockUsePreApproval.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })
      render(wrap(<MedicationLoanPage />))
      expect(document.querySelector(".animate-spin")).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("shows error message when query fails", () => {
      mockUsePreApproval.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
      })
      render(wrap(<MedicationLoanPage />))
      expect(
        screen.getByText("Could not load loan pre-approval details."),
      ).toBeInTheDocument()
    })

    it("shows error message when data is null", () => {
      mockUsePreApproval.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      })
      render(wrap(<MedicationLoanPage />))
      expect(
        screen.getByText("Could not load loan pre-approval details."),
      ).toBeInTheDocument()
    })
  })

  describe("pre-approved state", () => {
    it("shows the Pre-Approved badge", () => {
      render(wrap(<MedicationLoanPage />))
      expect(screen.getByText("Pre-Approved")).toBeInTheDocument()
    })

    it("displays the maximum loan amount", () => {
      render(wrap(<MedicationLoanPage />))
      expect(screen.getByText("KES 5,500")).toBeInTheDocument()
    })

    it("displays the expiry date", () => {
      render(wrap(<MedicationLoanPage />))
      // The exact day may vary by timezone (Sep 30 vs Oct 1 for 23:59:59Z)
      expect(
        screen.getByText(/Expires.*2026/),
      ).toBeInTheDocument()
    })

    it("displays the approval reason", () => {
      render(wrap(<MedicationLoanPage />))
      expect(
        screen.getByText(/Based on your 8-month purchase history/),
      ).toBeInTheDocument()
    })

    it("displays the target pharmacy", () => {
      render(wrap(<MedicationLoanPage />))
      expect(
        screen.getByText("City Chemist Mombasa"),
      ).toBeInTheDocument()
    })

    it("lists all covered medications with costs", () => {
      render(wrap(<MedicationLoanPage />))
      expect(screen.getByText("Metformin 500mg")).toBeInTheDocument()
      expect(screen.getByText("Amlodipine 5mg")).toBeInTheDocument()
      expect(screen.getByText("Aspirin 75mg")).toBeInTheDocument()
      expect(screen.getByText("KES 2,400")).toBeInTheDocument()
      expect(screen.getByText("KES 1,800")).toBeInTheDocument()
      expect(screen.getByText("KES 900")).toBeInTheDocument()
    })

    it("shows the total estimated cost", () => {
      render(wrap(<MedicationLoanPage />))
      expect(screen.getByText("KES 5,100")).toBeInTheDocument()
    })

    it("renders Accept Loan and Decline buttons", () => {
      render(wrap(<MedicationLoanPage />))
      expect(
        screen.getByRole("button", { name: /Accept Loan/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /Decline/i }),
      ).toBeInTheDocument()
    })
  })

  describe("not eligible state", () => {
    beforeEach(() => {
      mockUsePreApproval.mockReturnValue({
        data: notEligibleData,
        isLoading: false,
        error: null,
      })
    })

    it("shows the Not Eligible badge", () => {
      render(wrap(<MedicationLoanPage />))
      expect(screen.getByText("Not Eligible")).toBeInTheDocument()
    })

    it("shows eligibility improvement tips", () => {
      render(wrap(<MedicationLoanPage />))
      expect(
        screen.getByText("Tips to Improve Eligibility"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Build your Care Saver balance"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Maintain consistent refills"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Join or stay active in a Jireh Circle"),
      ).toBeInTheDocument()
    })

    it("does not show Accept or Decline buttons", () => {
      render(wrap(<MedicationLoanPage />))
      expect(
        screen.queryByRole("button", { name: /Accept Loan/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /^Decline$/i }),
      ).not.toBeInTheDocument()
    })
  })

  describe("accept loan flow", () => {
    it("opens confirmation dialog when Accept Loan is tapped", () => {
      render(wrap(<MedicationLoanPage />))

      fireEvent.click(screen.getByRole("button", { name: /Accept Loan/i }))

      expect(
        screen.getByText("Accept Medication Loan"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Review the loan details below before confirming."),
      ).toBeInTheDocument()
    })

    it("shows loan details in the confirmation dialog", () => {
      render(wrap(<MedicationLoanPage />))

      fireEvent.click(screen.getByRole("button", { name: /Accept Loan/i }))

      // Dialog should show the summary
      expect(
        screen.getByRole("button", { name: /Confirm & Accept/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /Go Back/i }),
      ).toBeInTheDocument()
    })

    it("shows success state after confirming loan acceptance", () => {
      render(wrap(<MedicationLoanPage />))

      // Open dialog
      fireEvent.click(screen.getByRole("button", { name: /Accept Loan/i }))
      // Confirm
      fireEvent.click(
        screen.getByRole("button", { name: /Confirm & Accept/i }),
      )

      expect(screen.getByText("Loan Accepted")).toBeInTheDocument()
      expect(
        screen.getByText(
          /Your medication loan has been confirmed/,
        ),
      ).toBeInTheDocument()
    })
  })

  describe("decline loan flow", () => {
    it("shows declined state when Decline is tapped", () => {
      render(wrap(<MedicationLoanPage />))

      fireEvent.click(screen.getByRole("button", { name: /^Decline$/i }))

      expect(screen.getByText("Loan Declined")).toBeInTheDocument()
      expect(
        screen.getByText(
          /You have declined this medication loan offer/,
        ),
      ).toBeInTheDocument()
    })
  })

  describe("analytics", () => {
    it("fires MEDICATION_LOAN.VIEW on mount", () => {
      render(wrap(<MedicationLoanPage />))
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:MedicationLoan:view",
      )
    })

    it("fires MEDICATION_LOAN.PRE_APPROVAL_VIEW when data loads", () => {
      render(wrap(<MedicationLoanPage />))
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:MedicationLoan:pre-approval-view",
        { isPreApproved: true },
      )
    })

    it("fires MEDICATION_LOAN.ACCEPT_TAP when Accept Loan is tapped", () => {
      render(wrap(<MedicationLoanPage />))
      fireEvent.click(screen.getByRole("button", { name: /Accept Loan/i }))
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:MedicationLoan:accept-tap",
      )
    })

    it("fires MEDICATION_LOAN.DECLINE_TAP when Decline is tapped", () => {
      render(wrap(<MedicationLoanPage />))
      fireEvent.click(screen.getByRole("button", { name: /^Decline$/i }))
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:MedicationLoan:decline-tap",
      )
    })
  })
})
