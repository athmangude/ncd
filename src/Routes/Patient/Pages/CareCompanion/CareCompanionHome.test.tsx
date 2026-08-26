// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockHomeData = {
  refillSchedule: {
    schedules: [
      {
        id: "refill-1",
        medicationName: "Metformin 500mg",
        expectedRefillDate: "2026-08-20",
        status: "OVERDUE",
        daysUntilRefill: -5,
        estimatedDaysSupply: 30,
        escalatedToLoanOffer: true,
      },
      {
        id: "refill-2",
        medicationName: "Amlodipine 5mg",
        expectedRefillDate: "2026-08-27",
        status: "DUE",
        daysUntilRefill: 2,
        estimatedDaysSupply: 30,
        escalatedToLoanOffer: false,
      },
    ],
    hasMore: true,
  },
  costSummary: {
    year: 2026,
    ytdSpend: "18000.00",
    monthlyAverage: "2571.43",
    cashbackEarned: "1260.00",
    netSpend: "16740.00",
    annualProjection: "30857.14",
    transactionCount: 24,
    currency: "KES" as const,
  },
  educationFeed: {
    id: "edu-dietary-001",
    conditionType: "DIABETES" as const,
    contentType: "DIETARY" as const,
    locale: "EN" as const,
    title: "Ugali portions that work for blood sugar control",
    body: "Test body",
    weekNumber: 1,
    imageUrl: null,
    isPublished: true,
    householdCompatible: true,
    costNeutral: true,
  },
  emergencyCard: {
    conditionType: "DIABETES",
    title: "Diabetes Emergency Card",
    cardId: "ec-diabetes-en",
  },
  emergencyTransportCredit: {
    isAvailable: true,
    preApprovedAmount: "2000",
    expiresAt: "2026-12-31T23:59:59Z",
  },
}

vi.mock("./hooks/useCareCompanionHome", () => ({
  useCareCompanionHome: vi.fn(() => ({
    data: mockHomeData,
    isLoading: false,
    error: null,
  })),
}))

vi.mock("./components/SectionErrorBoundary", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")

  class MockSectionErrorBoundary extends React.Component<
    {
      sectionName: string
      children: React.ReactNode
      fallbackContent?: React.ReactNode
    },
    { hasError: boolean }
  > {
    constructor(props: { sectionName: string }) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
      return { hasError: true }
    }

    componentDidCatch() {
      // intentionally empty
    }

    render() {
      if (this.state.hasError) {
        if (this.props.fallbackContent) {
          return this.props.fallbackContent
        }
        return React.createElement(
          "div",
          {
            role: "alert",
            "data-testid": `fallback-${this.props.sectionName}`,
          },
          `Unable to load ${this.props.sectionName}`,
        )
      }
      return this.props.children
    }
  }

  return { SectionErrorBoundary: MockSectionErrorBoundary }
})

vi.mock("./components/EmergencyCardStaticFallback", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  return {
    EmergencyCardStaticFallback: () =>
      React.createElement(
        "div",
        { "data-testid": "emergency-card-static-fallback" },
        "Emergency Contacts Fallback",
      ),
  }
})

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import CareCompanionHome from "./CareCompanionHome"
import { SectionErrorBoundary } from "./components/SectionErrorBoundary"
import { EmergencyCardStaticFallback } from "./components/EmergencyCardStaticFallback"

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

function AlwaysThrow({ message }: { message: string }): JSX.Element {
  throw new Error(message)
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CareCompanionHome", () => {
  describe("normal rendering", () => {
    it("renders refill schedule card with medication names", () => {
      render(wrap(<CareCompanionHome />))
      expect(screen.getByText("Refill Schedule")).toBeInTheDocument()
      expect(screen.getByText("Metformin 500mg")).toBeInTheDocument()
      expect(screen.getByText("Amlodipine 5mg")).toBeInTheDocument()
    })

    it("shows overdue badge for overdue refills", () => {
      render(wrap(<CareCompanionHome />))
      expect(screen.getByText("1 overdue, 1 due soon")).toBeInTheDocument()
      expect(screen.getByText("5 days overdue")).toBeInTheDocument()
    })

    it("renders cost tracker card with KES amounts", () => {
      render(wrap(<CareCompanionHome />))
      expect(screen.getByText("Cost Tracker")).toBeInTheDocument()
      expect(screen.getByText("KES 18,000")).toBeInTheDocument()
      expect(screen.getByText("KES 1,260")).toBeInTheDocument()
    })

    it("renders emergency card with title and transport credit", () => {
      render(wrap(<CareCompanionHome />))
      expect(
        screen.getByText("Diabetes Emergency Card"),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/2,000/),
      ).toBeInTheDocument()
    })

    it("renders education card with article title", () => {
      render(wrap(<CareCompanionHome />))
      expect(
        screen.getByText("Ugali portions that work for blood sugar control"),
      ).toBeInTheDocument()
    })
  })

  describe("crash isolation", () => {
    it("isolates a crash in one section without affecting others", () => {
      render(
        <div>
          <SectionErrorBoundary sectionName="Refill Schedule">
            <section aria-label="Refill Schedule">
              <div>Refill content</div>
            </section>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Cost Tracker">
            <section aria-label="Cost Tracker">
              <AlwaysThrow message="Cost Tracker crashed" />
            </section>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Emergency Card">
            <section aria-label="Emergency Card">
              <div>Emergency content</div>
            </section>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Education Feed">
            <section aria-label="Education Feed">
              <div>Education content</div>
            </section>
          </SectionErrorBoundary>
        </div>,
      )

      expect(
        screen.getByText("Unable to load Cost Tracker"),
      ).toBeInTheDocument()
      expect(screen.getByText("Refill content")).toBeInTheDocument()
      expect(screen.getByText("Emergency content")).toBeInTheDocument()
      expect(screen.getByText("Education content")).toBeInTheDocument()
    })

    it("renders EmergencyCardStaticFallback when Emergency Card throws", () => {
      render(
        <div>
          <SectionErrorBoundary sectionName="Refill Schedule">
            <section aria-label="Refill Schedule">
              <div>Refill content</div>
            </section>
          </SectionErrorBoundary>

          <SectionErrorBoundary
            sectionName="Emergency Card"
            fallbackContent={<EmergencyCardStaticFallback />}
          >
            <section aria-label="Emergency Card">
              <AlwaysThrow message="Emergency Card crashed" />
            </section>
          </SectionErrorBoundary>
        </div>,
      )

      expect(
        screen.getByTestId("emergency-card-static-fallback"),
      ).toBeInTheDocument()
      expect(
        screen.queryByText("Unable to load Emergency Card"),
      ).not.toBeInTheDocument()
      expect(screen.getByText("Refill content")).toBeInTheDocument()
    })
  })
})
