// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  CareHistorySummaryHeader,
  type CareHistorySummary,
} from "./CareHistorySummaryHeader"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSummary(
  overrides: Partial<CareHistorySummary> = {},
): CareHistorySummary {
  return {
    totalVisits: 12,
    facilitiesVisited: 3,
    dateRange: { from: "2025-12-18", to: "2026-08-05" },
    lastVisit: { date: "2026-08-28", facilityName: "Nairobi Hospital" },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CareHistorySummaryHeader", () => {
  it("renders 'Care History' as the card title", () => {
    render(<CareHistorySummaryHeader summary={makeSummary()} />)
    expect(
      screen.getByRole("heading", { name: "Care History" }),
    ).toBeInTheDocument()
  })

  it("renders formatted date range", () => {
    render(<CareHistorySummaryHeader summary={makeSummary()} />)
    expect(
      screen.getByText("18 Dec 2025 - 5 Aug 2026"),
    ).toBeInTheDocument()
  })

  it("renders single date when from and to are the same", () => {
    render(
      <CareHistorySummaryHeader
        summary={makeSummary({
          dateRange: { from: "2026-03-15", to: "2026-03-15" },
        })}
      />,
    )
    expect(screen.getByText("15 Mar 2026")).toBeInTheDocument()
    expect(screen.queryByText(/-/)).not.toBeInTheDocument()
  })

  it("renders total facility visits count with font-mono", () => {
    render(<CareHistorySummaryHeader summary={makeSummary()} />)
    const visitCount = screen.getByText("12")
    expect(visitCount).toBeInTheDocument()
    expect(visitCount.className).toContain("font-mono")
  })

  it("renders facilities visited count with font-mono", () => {
    render(<CareHistorySummaryHeader summary={makeSummary()} />)
    const facilityCount = screen.getByText("3")
    expect(facilityCount).toBeInTheDocument()
    expect(facilityCount.className).toContain("font-mono")
  })

  it("renders visit count and facility count labels", () => {
    render(<CareHistorySummaryHeader summary={makeSummary()} />)
    expect(screen.getByText("Facility visits")).toBeInTheDocument()
    expect(screen.getByText("Facilities")).toBeInTheDocument()
  })

  it("renders last visit info when lastVisit is non-null", () => {
    render(<CareHistorySummaryHeader summary={makeSummary()} />)
    expect(
      screen.getByText(/Last visit: 28 Aug 2026 at Nairobi Hospital/),
    ).toBeInTheDocument()
  })

  it("hides last visit line when lastVisit is null", () => {
    render(
      <CareHistorySummaryHeader
        summary={makeSummary({ lastVisit: null })}
      />,
    )
    expect(screen.queryByText(/Last visit/)).not.toBeInTheDocument()
  })

  it("renders facility count of 1 when there is only one facility", () => {
    render(
      <CareHistorySummaryHeader
        summary={makeSummary({ facilitiesVisited: 1 })}
      />,
    )
    expect(screen.getByText("1")).toBeInTheDocument()
  })
})
