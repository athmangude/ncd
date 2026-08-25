// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// ---------------------------------------------------------------------------
// Mocks — vi.mock is hoisted above all imports by Vitest, so factories
// must only reference values via require() or vi.hoisted().
// ---------------------------------------------------------------------------

// Mock SectionErrorBoundary with a real class-component error boundary so
// that crash-isolation tests work properly. The real implementation is
// tested in its own file; here we just need the catch-and-fallback contract.
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
      // intentionally empty — silences noisy test output
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

// Mock EmergencyCardStaticFallback with a detectable marker
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
// Imports — resolved after mocks are applied
// ---------------------------------------------------------------------------

import CareCompanionHome from "./CareCompanionHome"
import { SectionErrorBoundary } from "./components/SectionErrorBoundary"
import { EmergencyCardStaticFallback } from "./components/EmergencyCardStaticFallback"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Always throws on render — used for crash-isolation tests. */
function AlwaysThrow({ message }: { message: string }): JSX.Element {
  throw new Error(message)
}

// Suppress noisy React error-boundary console output in test runner
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CareCompanionHome", () => {
  describe("normal rendering", () => {
    it("renders all four section aria-labels", () => {
      render(<CareCompanionHome />)

      expect(
        screen.getByRole("region", { name: "Refill Schedule" }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("region", { name: "Cost Tracker" }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("region", { name: "Emergency Card" }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("region", { name: "Education Feed" }),
      ).toBeInTheDocument()
    })

    it("renders Refill Schedule section content", () => {
      render(<CareCompanionHome />)
      expect(
        screen.getByText("Your upcoming medication refills will appear here."),
      ).toBeInTheDocument()
    })

    it("renders Cost Tracker section content", () => {
      render(<CareCompanionHome />)
      expect(
        screen.getByText("Track your healthcare spending over time."),
      ).toBeInTheDocument()
    })

    it("renders Emergency Card section content", () => {
      render(<CareCompanionHome />)
      expect(
        screen.getByText(
          "Your emergency contacts and medical information.",
        ),
      ).toBeInTheDocument()
    })

    it("renders Education Feed section content", () => {
      render(<CareCompanionHome />)
      expect(
        screen.getByText("Health education articles and resources."),
      ).toBeInTheDocument()
    })

    it("renders all four section headings", () => {
      render(<CareCompanionHome />)

      const headings = screen.getAllByRole("heading", { level: 2 })
      const headingTexts = headings.map((h) => h.textContent)

      expect(headingTexts).toContain("Refill Schedule")
      expect(headingTexts).toContain("Cost Tracker")
      expect(headingTexts).toContain("Emergency Card")
      expect(headingTexts).toContain("Education Feed")
    })

    it("uses neutral bg-card styling on the Emergency Card section (not destructive)", () => {
      render(<CareCompanionHome />)
      const section = screen.getByRole("region", { name: "Emergency Card" })
      const card = section.querySelector("div")

      expect(card?.className).toContain("bg-card")
      expect(card?.className).not.toContain("bg-destructive")
      expect(card?.className).not.toContain("border-destructive")
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

      // The crashed section shows a fallback
      expect(
        screen.getByText("Unable to load Cost Tracker"),
      ).toBeInTheDocument()

      // The other three sections remain intact
      expect(screen.getByText("Refill content")).toBeInTheDocument()
      expect(screen.getByText("Emergency content")).toBeInTheDocument()
      expect(screen.getByText("Education content")).toBeInTheDocument()
    })

    it("renders EmergencyCardStaticFallback (not generic fallback) when Emergency Card throws", () => {
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

      // Emergency Card renders its domain-specific fallback
      expect(
        screen.getByTestId("emergency-card-static-fallback"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Emergency Contacts Fallback"),
      ).toBeInTheDocument()

      // It does NOT render the generic "Unable to load" message
      expect(
        screen.queryByText("Unable to load Emergency Card"),
      ).not.toBeInTheDocument()

      // Other sections remain intact
      expect(screen.getByText("Refill content")).toBeInTheDocument()
    })

    it("a crash in Education Feed does not affect Emergency Card", () => {
      render(
        <div>
          <SectionErrorBoundary sectionName="Emergency Card">
            <section aria-label="Emergency Card">
              <div>Emergency OK</div>
            </section>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Education Feed">
            <section aria-label="Education Feed">
              <AlwaysThrow message="Education Feed crashed" />
            </section>
          </SectionErrorBoundary>
        </div>,
      )

      expect(
        screen.getByText("Unable to load Education Feed"),
      ).toBeInTheDocument()
      expect(screen.getByText("Emergency OK")).toBeInTheDocument()
    })
  })
})
