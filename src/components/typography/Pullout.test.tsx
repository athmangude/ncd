import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Pullout } from "./Pullout"

describe("Pullout", () => {
  it("renders children", () => {
    render(<Pullout>You're one step closer to peace of mind.</Pullout>)
    expect(
      screen.getByText("You're one step closer to peace of mind.")
    ).toBeInTheDocument()
  })

  it("always applies italic and font-serif — brand restricts this face to italic use", () => {
    render(<Pullout>Some moment</Pullout>)
    const el = screen.getByText("Some moment")
    expect(el.className).toContain("italic")
    expect(el.className).toContain("font-serif")
  })

  it("merges a custom className", () => {
    render(<Pullout className="text-center">Some moment</Pullout>)
    const el = screen.getByText("Some moment")
    expect(el.className).toContain("text-center")
  })
})
