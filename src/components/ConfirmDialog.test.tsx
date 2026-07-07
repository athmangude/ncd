import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ConfirmDialog } from "./ConfirmDialog"

describe("ConfirmDialog", () => {
  it("renders title, description, and action labels", () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Exit Verification?"
        description="Are you sure?"
        confirmLabel="Exit"
        cancelLabel="Stay"
      />
    )

    expect(screen.getByText("Exit Verification?")).toBeInTheDocument()
    expect(screen.getByText("Are you sure?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Exit" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Stay" })).toBeInTheDocument()
  })

  it("calls onConfirm when the confirm action is clicked", () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        title="Cancel Payment Request?"
        confirmLabel="Cancel Request"
        cancelLabel="Keep Request"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Cancel Request" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onOpenChange(false) when the cancel action is clicked", () => {
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        title="Exit Verification?"
        confirmLabel="Exit"
        cancelLabel="Cancel"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("does not dismiss on outside click — AlertDialog semantics, not plain Dialog", () => {
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        title="Exit Verification?"
      />
    )

    // Radix AlertDialog's overlay intentionally has no dismiss-on-click handler
    // (unlike Dialog's overlay) — clicking it must not call onOpenChange at all.
    const overlay = document.querySelector(
      "[data-radix-alert-dialog-overlay], [data-state='open'].fixed.inset-0"
    )
    expect(overlay).toBeTruthy()
    if (overlay) fireEvent.click(overlay)

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("renders extra children between description and actions", () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Cancel Payment Request?"
      >
        <div data-testid="payment-details">Facility: Aga Khan</div>
      </ConfirmDialog>
    )

    expect(screen.getByTestId("payment-details")).toBeInTheDocument()
  })
})
