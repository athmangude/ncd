import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import IntakeProgress from "./IntakeProgress"

describe("IntakeProgress", () => {
  it("renders the step label and percentage", () => {
    render(<IntakeProgress currentStep={2} totalSteps={5} />)
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument()
    expect(screen.getByText("40%")).toBeInTheDocument()
  })

  it("shows 0% when currentStep is 0", () => {
    render(<IntakeProgress currentStep={0} totalSteps={5} />)
    expect(screen.getByText("Step 0 of 5")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("shows 100% when currentStep equals totalSteps", () => {
    render(<IntakeProgress currentStep={5} totalSteps={5} />)
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("clamps currentStep to totalSteps when currentStep exceeds totalSteps", () => {
    render(<IntakeProgress currentStep={10} totalSteps={5} />)
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("clamps negative currentStep to 0", () => {
    render(<IntakeProgress currentStep={-3} totalSteps={5} />)
    expect(screen.getByText("Step 0 of 5")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("handles totalSteps of 0 without dividing by zero", () => {
    render(<IntakeProgress currentStep={0} totalSteps={0} />)
    expect(screen.getByText("Step 0 of 0")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("renders a progress bar with accessible label", () => {
    render(<IntakeProgress currentStep={3} totalSteps={7} />)
    expect(screen.getByLabelText("Step 3 of 7")).toBeInTheDocument()
  })

  it("rounds percentage to the nearest integer", () => {
    render(<IntakeProgress currentStep={1} totalSteps={3} />)
    // 1/3 = 33.33... -> 33%
    expect(screen.getByText("33%")).toBeInTheDocument()
  })

  it("passes custom className to the outer container", () => {
    const { container } = render(
      <IntakeProgress currentStep={1} totalSteps={3} className="mt-6" />
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain("mt-6")
  })

  it("handles a single-step flow (step 1 of 1)", () => {
    render(<IntakeProgress currentStep={1} totalSteps={1} />)
    expect(screen.getByText("Step 1 of 1")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("renders correct percentage for step 2 of 4 (50%)", () => {
    render(<IntakeProgress currentStep={2} totalSteps={4} />)
    expect(screen.getByText("50%")).toBeInTheDocument()
  })
})
