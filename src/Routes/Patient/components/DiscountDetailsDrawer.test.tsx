import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DiscountDetailsDrawer } from "./DiscountDetailsDrawer"
import type { DiscountCode } from "../Pages/Dashboard/components/DiscountsSection"

// vaul reads matchMedia + pointer-capture APIs that jsdom doesn't implement.
beforeAll(() => {
  Element.prototype.setPointerCapture ??= vi.fn()
  Element.prototype.releasePointerCapture ??= vi.fn()
  Element.prototype.hasPointerCapture ??= vi.fn(() => false)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

const discount: DiscountCode = {
  id: 1,
  code: "WELCOME15",
  description: "15% off your first facility payment with Jireh",
  discountType: "PERCENTAGE",
  discountValue: "15",
  currency: { id: 1, code: "KES", name: "Kenyan Shilling", symbol: "KES" },
  context: "PROMOTIONAL",
  discountAmount: "0",
  validFrom: null,
  validUntil: "2026-12-31T23:59:59.000Z",
  minimumOrderAmount: "1000",
  maximumDiscountAmount: "3000",
  isActive: true,
  isValid: true,
}

describe("DiscountDetailsDrawer — onApply CTA", () => {
  it("shows 'Copy code' by default (no onApply passed)", () => {
    render(
      <DiscountDetailsDrawer discount={discount} open onOpenChange={vi.fn()} />
    )
    expect(
      screen.getByRole("button", { name: /copy code 'welcome15'/i })
    ).toBeInTheDocument()
  })

  it("shows 'Apply code' instead of 'Copy code' when onApply is provided", () => {
    render(
      <DiscountDetailsDrawer
        discount={discount}
        open
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />
    )
    expect(
      screen.getByRole("button", { name: /apply code 'welcome15'/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /copy code/i })
    ).not.toBeInTheDocument()
  })

  it("calls onApply (not the clipboard) when the primary CTA is clicked", async () => {
    const onApply = vi.fn()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(
      <DiscountDetailsDrawer
        discount={discount}
        open
        onOpenChange={vi.fn()}
        onApply={onApply}
      />
    )
    await userEvent.click(
      screen.getByRole("button", { name: /apply code 'welcome15'/i })
    )
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(writeText).not.toHaveBeenCalled()
  })

  it("the apply CTA is never disabled by the copy-confirmation state", () => {
    render(
      <DiscountDetailsDrawer
        discount={discount}
        open
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />
    )
    expect(
      screen.getByRole("button", { name: /apply code 'welcome15'/i })
    ).not.toBeDisabled()
  })

  it("renders the discount stats (min bill, max discount, valid until)", () => {
    render(
      <DiscountDetailsDrawer discount={discount} open onOpenChange={vi.fn()} />
    )
    expect(screen.getByText("KES 1,000")).toBeInTheDocument()
    expect(screen.getByText("KES 3,000")).toBeInTheDocument()
  })

  it("renders nothing discount-specific when discount is null", () => {
    render(
      <DiscountDetailsDrawer discount={null} open onOpenChange={vi.fn()} />
    )
    expect(screen.queryByText("WELCOME15")).not.toBeInTheDocument()
  })
})
