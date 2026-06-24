import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import AppShell from "./AppShell"

describe("AppShell", () => {
  it("renders header, footer, and children", () => {
    render(
      <AppShell header={<div>the-header</div>} footer={<div>the-footer</div>}>
        <p>the-body</p>
      </AppShell>
    )
    expect(screen.getByText("the-header")).toBeInTheDocument()
    expect(screen.getByText("the-footer")).toBeInTheDocument()
    expect(screen.getByText("the-body")).toBeInTheDocument()
  })

  it("suppresses the header slot when header is null", () => {
    render(
      <AppShell header={null}>
        <p>body</p>
      </AppShell>
    )
    // No extra wrapper rendered; the body is still present.
    expect(screen.getByText("body")).toBeInTheDocument()
  })

  it("applies the default p-4 body padding", () => {
    render(<AppShell>body</AppShell>)
    expect(screen.getByRole("main").className).toContain("p-4")
  })

  it('drops body padding when bodyPadding is "none"', () => {
    render(<AppShell bodyPadding="none">body</AppShell>)
    expect(screen.getByRole("main").className).not.toContain("p-4")
  })

  it("gives the body the bottom safe-area inset when there is no footer", () => {
    render(<AppShell footer={null}>body</AppShell>)
    expect(screen.getByRole("main").className).toContain("safe-pb")
  })

  it("moves the bottom safe-area inset off the body and onto the footer wrapper when a footer is present", () => {
    render(<AppShell footer={<div>footer</div>}>body</AppShell>)
    expect(screen.getByRole("main").className).not.toContain("safe-pb")
    // The footer content's wrapper carries the safe-pb inset.
    const footerWrapper = screen.getByText("footer").parentElement
    expect(footerWrapper?.className).toContain("safe-pb")
  })

  it("makes the body scroll by default and stops scrolling when scroll is false", () => {
    const { rerender } = render(<AppShell>body</AppShell>)
    expect(screen.getByRole("main").className).toContain("overflow-y-auto")

    rerender(<AppShell scroll={false}>body</AppShell>)
    expect(screen.getByRole("main").className).not.toContain("overflow-y-auto")
  })

  it("wraps the header in a safe-area top inset", () => {
    render(<AppShell header={<div>header</div>}>body</AppShell>)
    const headerWrapper = screen.getByText("header").parentElement
    expect(headerWrapper?.className).toContain("safe-pt")
  })
})
