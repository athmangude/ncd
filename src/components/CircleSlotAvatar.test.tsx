import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CircleSlotAvatar } from "./CircleSlotAvatar"

const baseProps = {
  firstName: "Jane",
  lastName: "Doe",
  profilePhoto: null,
}

describe("CircleSlotAvatar", () => {
  it("renders a neutral halo with no dot or lock for variant=member", () => {
    render(<CircleSlotAvatar {...baseProps} variant="member" />)
    expect(screen.getByTestId("avatar-halo")).toHaveClass("bg-muted")
    expect(screen.queryByTestId("avatar-dot")).not.toBeInTheDocument()
    expect(screen.queryByTestId("lock-icon")).not.toBeInTheDocument()
  })

  it("renders no badge for variant=member even when showBadge is set", () => {
    render(<CircleSlotAvatar {...baseProps} variant="member" showBadge />)
    expect(screen.queryByTestId("avatar-badge")).not.toBeInTheDocument()
  })

  it("renders the purple halo for variant=active", () => {
    render(<CircleSlotAvatar {...baseProps} variant="active" />)
    expect(screen.getByTestId("avatar-halo")).toHaveClass("bg-secondary")
  })

  it("renders green halo + green dot for variant=new", () => {
    render(<CircleSlotAvatar {...baseProps} variant="new" />)
    expect(screen.getByTestId("avatar-halo")).toHaveClass("bg-success")
    expect(screen.getByTestId("avatar-dot")).toHaveClass("bg-success-solid")
  })

  it("renders orange dot for variant=pending", () => {
    render(<CircleSlotAvatar {...baseProps} variant="pending" />)
    expect(screen.getByTestId("avatar-dot")).toHaveClass("bg-warning-solid")
  })

  it("renders red dot for variant=defaulted", () => {
    render(<CircleSlotAvatar {...baseProps} variant="defaulted" />)
    expect(screen.getByTestId("avatar-dot")).toHaveClass("bg-destructive")
  })

  it("renders a padlock for variant=inactive", () => {
    render(<CircleSlotAvatar {...baseProps} variant="inactive" />)
    expect(screen.getByTestId("lock-icon")).toBeInTheDocument()
  })

  it("fades the avatar for variant=left", () => {
    render(<CircleSlotAvatar {...baseProps} variant="left" />)
    expect(screen.getByTestId("avatar-halo")).toHaveClass("opacity-40")
  })

  it("renders an empty-slot button with plus icon for variant=empty", () => {
    const onClick = vi.fn()
    render(
      <CircleSlotAvatar {...baseProps} variant="empty" onClick={onClick} />
    )
    const button = screen.getByTestId("empty-slot")
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("wraps in a button when onClick is provided on non-empty variants", () => {
    const onClick = vi.fn()
    render(
      <CircleSlotAvatar {...baseProps} variant="active" onClick={onClick} />
    )
    const wrapper = screen.getByRole("button", { name: /Jane Doe/i })
    fireEvent.click(wrapper)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("disables the empty-slot button when no onClick", () => {
    render(<CircleSlotAvatar variant="empty" />)
    expect(screen.getByTestId("empty-slot")).toBeDisabled()
  })

  it("does not render a badge by default", () => {
    render(<CircleSlotAvatar {...baseProps} variant="new" />)
    expect(screen.queryByTestId("avatar-badge")).not.toBeInTheDocument()
  })

  it("renders the variant badge when showBadge is set", () => {
    render(<CircleSlotAvatar {...baseProps} variant="new" showBadge />)
    const badge = screen.getByTestId("avatar-badge")
    expect(badge).toHaveTextContent("New!")
    expect(badge).toHaveClass("bg-success", "text-success-foreground")
  })

  it("renders the pending badge text when showBadge is set", () => {
    render(<CircleSlotAvatar {...baseProps} variant="pending" showBadge />)
    expect(screen.getByTestId("avatar-badge")).toHaveTextContent("Waiting...")
  })

  it("renders no badge for variants without one even when showBadge is set", () => {
    render(<CircleSlotAvatar {...baseProps} variant="active" showBadge />)
    expect(screen.queryByTestId("avatar-badge")).not.toBeInTheDocument()
  })

  it("defaults to md (48px) avatar size", () => {
    const { container } = render(
      <CircleSlotAvatar {...baseProps} variant="active" />
    )
    expect(
      container.querySelector('[data-testid="avatar-halo"] .h-12.w-12')
    ).not.toBeNull()
  })

  it("renders a larger avatar for size=lg", () => {
    const { container } = render(
      <CircleSlotAvatar {...baseProps} variant="active" size="lg" />
    )
    expect(
      container.querySelector('[data-testid="avatar-halo"] .h-20.w-20')
    ).not.toBeNull()
  })

  it("renders a smaller avatar for size=sm", () => {
    const { container } = render(
      <CircleSlotAvatar {...baseProps} variant="active" size="sm" />
    )
    expect(
      container.querySelector('[data-testid="avatar-halo"] .h-6.w-6')
    ).not.toBeNull()
  })

  it("scales the status dot with size=lg", () => {
    render(<CircleSlotAvatar {...baseProps} variant="new" size="lg" />)
    const dot = screen.getByTestId("avatar-dot")
    expect(dot).toHaveClass("h-4", "w-4", "bg-success-solid")
  })

  it("scales the empty-slot box with size=lg", () => {
    render(<CircleSlotAvatar variant="empty" size="lg" onClick={vi.fn()} />)
    expect(screen.getByTestId("empty-slot")).toHaveClass("h-20", "w-20")
  })

  it("keeps the badge inside the interactive button when onClick is provided", () => {
    const onClick = vi.fn()
    render(
      <CircleSlotAvatar
        {...baseProps}
        variant="new"
        showBadge
        onClick={onClick}
      />
    )
    const wrapper = screen.getByRole("button", { name: /Jane Doe/i })
    expect(wrapper).toContainElement(screen.getByTestId("avatar-badge"))
  })
})
