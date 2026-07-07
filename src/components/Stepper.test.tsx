import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Stepper } from "./Stepper"

describe("Stepper", () => {
  it("exposes progress semantics as a labelled group", () => {
    render(<Stepper currentStep={2} totalSteps={4} />)
    const group = screen.getByRole("group", { name: "Step 2 of 4" })
    expect(group).toBeInTheDocument()
  })

  it("updates the aria-label as the current step changes", () => {
    const { rerender } = render(<Stepper currentStep={1} totalSteps={3} />)
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Step 1 of 3"
    )

    rerender(<Stepper currentStep={3} totalSteps={3} />)
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Step 3 of 3"
    )
  })
})
