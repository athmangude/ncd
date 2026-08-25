// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SectionErrorBoundary } from "./SectionErrorBoundary"
import { EmergencyCardStaticFallback } from "./EmergencyCardStaticFallback"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Always throws, used for tests that don't need recovery. */
function AlwaysThrow(): JSX.Element {
  throw new Error("kaboom")
}

/**
 * Conditionally throws based on an external flag. We toggle `shouldThrow`
 * before clicking Retry so the remounted component renders cleanly.
 */
let shouldThrow = true

function ConditionalThrow({ label }: { label: string }) {
  if (shouldThrow) {
    throw new Error("boom")
  }
  return <div>{label}</div>
}

// Suppress noisy React error-boundary console output in test runner
beforeEach(() => {
  shouldThrow = true
  vi.spyOn(console, "error").mockImplementation(() => {})
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SectionErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <SectionErrorBoundary sectionName="Cost Tracker">
        <p>All good</p>
      </SectionErrorBoundary>,
    )
    expect(screen.getByText("All good")).toBeInTheDocument()
  })

  it("renders the generic fallback with section name when a child throws", () => {
    render(
      <SectionErrorBoundary sectionName="Cost Tracker">
        <AlwaysThrow />
      </SectionErrorBoundary>,
    )
    expect(
      screen.getByText("Unable to load Cost Tracker"),
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeInTheDocument()
  })

  it("clicking Retry resets the boundary and remounts children", async () => {
    const user = userEvent.setup()

    render(
      <SectionErrorBoundary sectionName="Medications">
        <ConditionalThrow label="Recovered!" />
      </SectionErrorBoundary>,
    )

    // First render threw, so we see the fallback
    expect(screen.getByText("Unable to load Medications")).toBeInTheDocument()

    // Stop throwing before clicking Retry so the remounted child succeeds
    shouldThrow = false
    await user.click(screen.getByRole("button", { name: /retry/i }))

    expect(screen.getByText("Recovered!")).toBeInTheDocument()
    expect(
      screen.queryByText("Unable to load Medications"),
    ).not.toBeInTheDocument()
  })

  it("renders custom fallbackContent instead of the generic message", () => {
    render(
      <SectionErrorBoundary
        sectionName="Emergency"
        fallbackContent={<div>Custom fallback</div>}
      >
        <AlwaysThrow />
      </SectionErrorBoundary>,
    )
    expect(screen.getByText("Custom fallback")).toBeInTheDocument()
    expect(
      screen.queryByText("Unable to load Emergency"),
    ).not.toBeInTheDocument()
  })

  it("renders EmergencyCardStaticFallback (not the generic error) when the Emergency Card section crashes", () => {
    render(
      <SectionErrorBoundary
        sectionName="Emergency Card"
        fallbackContent={<EmergencyCardStaticFallback />}
      >
        <AlwaysThrow />
      </SectionErrorBoundary>,
    )

    // Static fallback's own content is shown
    expect(
      screen.getByRole("alert", { name: /emergency contacts/i }),
    ).toBeInTheDocument()
    expect(screen.getByText("Emergency Contacts")).toBeInTheDocument()
    expect(screen.getByText("999")).toBeInTheDocument()

    // The generic boundary fallback (with its own Retry button) is absent
    expect(
      screen.queryByText("Unable to load Emergency Card"),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument()
  })

  it("calls console.error via componentDidCatch when a child throws", () => {
    render(
      <SectionErrorBoundary sectionName="Vitals">
        <AlwaysThrow />
      </SectionErrorBoundary>,
    )

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[SectionErrorBoundary] Vitals crashed:"),
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    )
  })

  it("uses bg-muted styling on the generic fallback container", () => {
    render(
      <SectionErrorBoundary sectionName="Section">
        <AlwaysThrow />
      </SectionErrorBoundary>,
    )
    const alert = screen.getByRole("alert")
    expect(alert.className).toContain("bg-muted")
    expect(alert.className).toContain("rounded-md")
  })
})
