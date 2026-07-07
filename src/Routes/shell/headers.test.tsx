import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BackTitleHeader } from "./headers"

describe("BackTitleHeader", () => {
  it("labels the ghost back button for screen readers", () => {
    render(<BackTitleHeader title="Treatment" />)
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument()
  })

  it("invokes onBack when the labelled back button is pressed", () => {
    const onBack = vi.fn()
    render(<BackTitleHeader title="Treatment" onBack={onBack} />)
    fireEvent.click(screen.getByRole("button", { name: "Go back" }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("renders the title", () => {
    render(<BackTitleHeader title="Treatment details" />)
    expect(screen.getByText("Treatment details")).toBeInTheDocument()
  })
})
