import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Chip } from "./Chip"

describe("Chip", () => {
  it("renders a real <button> carrying the Badge variant (no per-call palette)", () => {
    render(<Chip>All</Chip>)
    const el = screen.getByRole("button", { name: "All" })
    expect(el.tagName).toBe("BUTTON")
    // defaults to secondary via Badge
    expect(el.getAttribute("data-variant")).toBe("secondary")
    expect(el.className).not.toMatch(/bg-(purple|teal|orange)-\d/)
  })

  it("fires onClick when the chip is pressed", () => {
    const onClick = vi.fn()
    render(<Chip onClick={onClick}>Hospitals</Chip>)
    fireEvent.click(screen.getByRole("button", { name: "Hospitals" }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("renders a remove ✕ that fires onRemove without triggering the chip onClick", () => {
    const onClick = vi.fn()
    const onRemove = vi.fn()
    render(
      <Chip onClick={onClick} onRemove={onRemove} removeLabel="Remove Nairobi">
        Nairobi
      </Chip>
    )
    fireEvent.click(screen.getByRole("button", { name: "Remove Nairobi" }))
    expect(onRemove).toHaveBeenCalledOnce()
    expect(onClick).not.toHaveBeenCalled()
  })

  it("honours a chosen variant", () => {
    render(<Chip variant="outline">Filter</Chip>)
    expect(
      screen
        .getByRole("button", { name: "Filter" })
        .getAttribute("data-variant")
    ).toBe("outline")
  })
})
