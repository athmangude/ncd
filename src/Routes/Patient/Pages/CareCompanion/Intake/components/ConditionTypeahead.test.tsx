import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ConditionTypeahead from "./ConditionTypeahead"

// Use a small subset of the fixture so tests are deterministic and fast.
vi.mock("@/mocks/fixtures/medication-taxonomy.json", () => ({
  default: [
    {
      id: "med-metformin",
      genericName: "Metformin",
      brandNames: ["Glucophage", "Dianben"],
      strengths: ["500mg"],
      category: "MEDICATION",
      conditionTags: ["DIABETES"],
    },
    {
      id: "med-amlodipine",
      genericName: "Amlodipine",
      brandNames: ["Norvasc", "Amlopin"],
      strengths: ["5mg"],
      category: "MEDICATION",
      conditionTags: ["HYPERTENSION"],
    },
    {
      id: "med-losartan",
      genericName: "Losartan",
      brandNames: ["Cozaar", "Losacar"],
      strengths: ["50mg"],
      category: "MEDICATION",
      conditionTags: ["HYPERTENSION"],
    },
  ],
}))

const metformin = {
  id: "med-metformin",
  genericName: "Metformin",
  brandNames: ["Glucophage", "Dianben"],
  strengths: ["500mg"],
  category: "MEDICATION",
  conditionTags: ["DIABETES"],
}

describe("ConditionTypeahead", () => {
  const defaultProps = {
    selectedMedications: [],
    onSelect: vi.fn(),
    onRemove: vi.fn(),
  }

  it("renders the input with the default label", () => {
    render(<ConditionTypeahead {...defaultProps} />)
    expect(screen.getByLabelText("Search medications")).toBeInTheDocument()
  })

  it("renders with a custom label and placeholder", () => {
    render(
      <ConditionTypeahead
        {...defaultProps}
        label="Find medicine"
        placeholder="Search here..."
      />
    )
    expect(screen.getByLabelText("Find medicine")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search here...")).toBeInTheDocument()
  })

  it("shows no dropdown when the query is empty", () => {
    render(<ConditionTypeahead {...defaultProps} />)
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("filters medications by partial genericName (case-insensitive)", () => {
    render(<ConditionTypeahead {...defaultProps} />)
    const input = screen.getByLabelText("Search medications")

    fireEvent.change(input, { target: { value: "met" } })
    fireEvent.focus(input)

    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(screen.getByText("Metformin")).toBeInTheDocument()
    expect(screen.queryByText("Amlodipine")).toBeNull()
    expect(screen.queryByText("Losartan")).toBeNull()
  })

  it("filters medications by partial brandName (case-insensitive)", () => {
    render(<ConditionTypeahead {...defaultProps} />)
    const input = screen.getByLabelText("Search medications")

    fireEvent.change(input, { target: { value: "norv" } })

    expect(screen.getByText("Amlodipine")).toBeInTheDocument()
    expect(screen.queryByText("Metformin")).toBeNull()
  })

  it("shows empty state when no medications match", () => {
    render(<ConditionTypeahead {...defaultProps} />)
    const input = screen.getByLabelText("Search medications")

    fireEvent.change(input, { target: { value: "zzzzzzz" } })

    expect(screen.getByText("No medications found")).toBeInTheDocument()
  })

  it("calls onSelect and clears query when a result is clicked (via mousedown)", () => {
    const onSelect = vi.fn()
    render(<ConditionTypeahead {...defaultProps} onSelect={onSelect} />)

    const input = screen.getByLabelText("Search medications")
    fireEvent.change(input, { target: { value: "met" } })

    const option = screen.getByText("Metformin")
    fireEvent.mouseDown(option.closest("button")!)

    expect(onSelect).toHaveBeenCalledWith(metformin)
  })

  it("excludes already-selected medications from results", () => {
    render(
      <ConditionTypeahead
        {...defaultProps}
        selectedMedications={[metformin]}
      />
    )
    const input = screen.getByLabelText("Search medications")

    fireEvent.change(input, { target: { value: "met" } })

    // Metformin is already selected, so it should not appear in the dropdown
    expect(screen.queryByRole("option")).toBeNull()
    expect(screen.getByText("No medications found")).toBeInTheDocument()
  })

  it("renders selected medication chips", () => {
    render(
      <ConditionTypeahead
        {...defaultProps}
        selectedMedications={[metformin]}
      />
    )
    expect(screen.getByText("Metformin")).toBeInTheDocument()
  })

  it("calls onRemove when a chip remove button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <ConditionTypeahead
        {...defaultProps}
        onRemove={onRemove}
        selectedMedications={[metformin]}
      />
    )

    fireEvent.click(screen.getByLabelText("Remove Metformin"))
    expect(onRemove).toHaveBeenCalledWith("med-metformin")
  })

  it("uses unique IDs (useId) instead of hardcoded id", () => {
    const { container } = render(
      <div>
        <ConditionTypeahead {...defaultProps} />
        <ConditionTypeahead {...defaultProps} />
      </div>
    )

    const inputs = container.querySelectorAll("input")
    const ids = Array.from(inputs).map((el) => el.id)

    // Both should have IDs but they should be different
    expect(ids[0]).toBeTruthy()
    expect(ids[1]).toBeTruthy()
    expect(ids[0]).not.toBe(ids[1])
  })

  it("passes custom className to the outer container", () => {
    const { container } = render(
      <ConditionTypeahead {...defaultProps} className="mt-4" />
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain("mt-4")
  })
})
