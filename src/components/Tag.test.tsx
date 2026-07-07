import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Tag from "./Tag"

describe("Tag", () => {
  it("defaults to the success variant so unmigrated callers stay visually unchanged", () => {
    render(<Tag>5 days left</Tag>)
    expect(screen.getByText("5 days left").className).toContain(
      "bg-success-solid"
    )
  })

  it("supports explicit destructive/warning/info/neutral variants", () => {
    render(<Tag variant="destructive">Overdue</Tag>)
    expect(screen.getByText("Overdue").className).toContain("bg-destructive")
  })

  it("still lets a passed className override the variant background", () => {
    render(<Tag className="bg-green-600">10% OFF</Tag>)
    expect(screen.getByText("10% OFF").className).toContain("bg-green-600")
  })
})
