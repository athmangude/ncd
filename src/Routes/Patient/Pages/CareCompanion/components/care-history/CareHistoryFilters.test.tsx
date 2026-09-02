// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import {
  EventTypeFilterChips,
  FacilityFilterChips,
} from "./CareHistoryFilters"

// ---------------------------------------------------------------------------
// EventTypeFilterChips
// ---------------------------------------------------------------------------

describe("EventTypeFilterChips", () => {
  it("renders all 5 chips: All, Visits, Medications, Lab Tests, Insights", () => {
    render(
      <EventTypeFilterChips
        activeFilter={null}
        onFilterChange={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Visits" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Medications" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Lab Tests" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Insights" })
    ).toBeInTheDocument()
  })

  it("calls onFilterChange(null) when All is tapped", () => {
    const onChange = vi.fn()
    render(
      <EventTypeFilterChips
        activeFilter="VISIT_GROUP"
        onFilterChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "All" }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("calls onFilterChange with VISIT_GROUP when Visits is tapped", () => {
    const onChange = vi.fn()
    render(
      <EventTypeFilterChips
        activeFilter={null}
        onFilterChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Visits" }))
    expect(onChange).toHaveBeenCalledWith("VISIT_GROUP")
  })

  it("calls onFilterChange with MEDICATIONS when Medications is tapped", () => {
    const onChange = vi.fn()
    render(
      <EventTypeFilterChips
        activeFilter={null}
        onFilterChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Medications" }))
    expect(onChange).toHaveBeenCalledWith("MEDICATIONS")
  })

  it("calls onFilterChange with LAB_TESTS when Lab Tests is tapped", () => {
    const onChange = vi.fn()
    render(
      <EventTypeFilterChips
        activeFilter={null}
        onFilterChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Lab Tests" }))
    expect(onChange).toHaveBeenCalledWith("LAB_TESTS")
  })

  it("calls onFilterChange with INSIGHTS when Insights is tapped", () => {
    const onChange = vi.fn()
    render(
      <EventTypeFilterChips
        activeFilter={null}
        onFilterChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Insights" }))
    expect(onChange).toHaveBeenCalledWith("INSIGHTS")
  })

  it("resets to null when tapping the already-active non-All chip", () => {
    const onChange = vi.fn()
    render(
      <EventTypeFilterChips
        activeFilter="MEDICATIONS"
        onFilterChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Medications" }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("highlights the active chip with primary styling", () => {
    render(
      <EventTypeFilterChips
        activeFilter="LAB_TESTS"
        onFilterChange={vi.fn()}
      />
    )

    const activeChip = screen.getByRole("button", { name: "Lab Tests" })
    expect(activeChip.className).toContain("bg-primary")
    expect(activeChip.className).toContain("text-primary-foreground")

    const inactiveChip = screen.getByRole("button", { name: "All" })
    expect(inactiveChip.className).toContain("bg-muted")
    expect(inactiveChip.className).toContain("text-muted-foreground")
  })

  it("highlights All chip when activeFilter is null", () => {
    render(
      <EventTypeFilterChips
        activeFilter={null}
        onFilterChange={vi.fn()}
      />
    )

    const allChip = screen.getByRole("button", { name: "All" })
    expect(allChip.className).toContain("bg-primary")
    expect(allChip.className).toContain("text-primary-foreground")
  })

  it("has overflow-x-auto and scrollbar-none on the container", () => {
    const { container } = render(
      <EventTypeFilterChips
        activeFilter={null}
        onFilterChange={vi.fn()}
      />
    )

    const row = container.firstElementChild as HTMLElement
    expect(row.className).toContain("overflow-x-auto")
    expect(row.className).toContain("scrollbar-none")
  })
})

// ---------------------------------------------------------------------------
// FacilityFilterChips
// ---------------------------------------------------------------------------

describe("FacilityFilterChips", () => {
  it("renders one chip per facility name", () => {
    render(
      <FacilityFilterChips
        facilities={["Nairobi Hospital", "City Chemist"]}
        activeFilter={null}
        onFilterChange={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", { name: "Nairobi Hospital" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "City Chemist" })
    ).toBeInTheDocument()
  })

  it("returns null when facilities array has 0 items", () => {
    const { container } = render(
      <FacilityFilterChips
        facilities={[]}
        activeFilter={null}
        onFilterChange={vi.fn()}
      />
    )

    expect(container.innerHTML).toBe("")
  })

  it("returns null when facilities array has 1 item", () => {
    const { container } = render(
      <FacilityFilterChips
        facilities={["Nairobi Hospital"]}
        activeFilter={null}
        onFilterChange={vi.fn()}
      />
    )

    expect(container.innerHTML).toBe("")
  })

  it("calls onFilterChange with facility name when tapped", () => {
    const onChange = vi.fn()
    render(
      <FacilityFilterChips
        facilities={["Nairobi Hospital", "City Chemist"]}
        activeFilter={null}
        onFilterChange={onChange}
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Nairobi Hospital" })
    )
    expect(onChange).toHaveBeenCalledWith("Nairobi Hospital")
  })

  it("deselects when tapping the already-active facility", () => {
    const onChange = vi.fn()
    render(
      <FacilityFilterChips
        facilities={["Nairobi Hospital", "City Chemist"]}
        activeFilter="Nairobi Hospital"
        onFilterChange={onChange}
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Nairobi Hospital" })
    )
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("highlights the active facility chip with primary styling", () => {
    render(
      <FacilityFilterChips
        facilities={["Nairobi Hospital", "City Chemist"]}
        activeFilter="City Chemist"
        onFilterChange={vi.fn()}
      />
    )

    const active = screen.getByRole("button", { name: "City Chemist" })
    expect(active.className).toContain("bg-primary")
    expect(active.className).toContain("text-primary-foreground")

    const inactive = screen.getByRole("button", {
      name: "Nairobi Hospital",
    })
    expect(inactive.className).toContain("bg-muted")
    expect(inactive.className).toContain("text-muted-foreground")
  })

  it("has overflow-x-auto and scrollbar-none on the container", () => {
    const { container } = render(
      <FacilityFilterChips
        facilities={["Nairobi Hospital", "City Chemist"]}
        activeFilter={null}
        onFilterChange={vi.fn()}
      />
    )

    const row = container.firstElementChild as HTMLElement
    expect(row.className).toContain("overflow-x-auto")
    expect(row.className).toContain("scrollbar-none")
  })
})
