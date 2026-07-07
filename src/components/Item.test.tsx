import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "./Item"

describe("Item", () => {
  it("renders the row slots and exposes variant/size via data attributes", () => {
    render(
      <Item variant="outline" size="sm">
        <ItemMedia>icon</ItemMedia>
        <ItemContent>
          <ItemTitle>Help &amp; Support</ItemTitle>
          <ItemDescription>Reach out to us</ItemDescription>
        </ItemContent>
        <ItemActions>chevron</ItemActions>
      </Item>
    )
    const row = screen.getByText("Help & Support").closest("[data-slot='item']")
    expect(row).not.toBeNull()
    expect(row).toHaveAttribute("data-variant", "outline")
    expect(row).toHaveAttribute("data-size", "sm")
    expect(screen.getByText("Reach out to us")).toBeInTheDocument()
  })

  it("asChild renders a real clickable <button> row (keyboard-focusable, no styled div)", () => {
    const onClick = vi.fn()
    render(
      <Item asChild>
        <button type="button" onClick={onClick}>
          <ItemContent>
            <ItemTitle>FAQs</ItemTitle>
          </ItemContent>
        </button>
      </Item>
    )
    const btn = screen.getByRole("button", { name: /faqs/i })
    expect(btn.tagName).toBe("BUTTON")
    expect(btn).toHaveAttribute("data-slot", "item")
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
