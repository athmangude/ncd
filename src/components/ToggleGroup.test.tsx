import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup"

describe("ToggleGroup", () => {
  it("renders a single-select segmented control with the tokenised item styling", () => {
    render(
      <ToggleGroup type="single" value="all">
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="jireh">Jireh partners</ToggleGroupItem>
      </ToggleGroup>
    )
    const all = screen.getByRole("radio", { name: "All" })
    const jireh = screen.getByRole("radio", { name: "Jireh partners" })
    // selected item carries the on state (bg-primary comes from the variant, not a per-call class)
    expect(all).toHaveAttribute("data-state", "on")
    expect(jireh).toHaveAttribute("data-state", "off")
    expect(all.className).not.toMatch(/bg-(purple|teal|orange)-\d/)
  })

  it("fires onValueChange when a different item is selected", () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup type="single" value="all" onValueChange={onValueChange}>
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="jireh">Jireh partners</ToggleGroupItem>
      </ToggleGroup>
    )
    fireEvent.click(screen.getByRole("radio", { name: "Jireh partners" }))
    expect(onValueChange).toHaveBeenCalledWith("jireh")
  })
})
