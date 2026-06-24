import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import MobileWrapper, {
  LogoHeader,
  BackTitleHeader,
  NavFooter,
  PrimaryCTAFooter,
  DualActionFooter,
} from "./MobileWrapper"

// MobileWrapper is now a thin wrapper over AppShell. These tests lock the
// back-compat surface the ~30 existing callers rely on.
describe("MobileWrapper (back-compat)", () => {
  it("renders header, footer, and children", () => {
    render(
      <MobileWrapper header={<div>hdr</div>} footer={<div>ftr</div>}>
        <p>content</p>
      </MobileWrapper>
    )
    expect(screen.getByText("hdr")).toBeInTheDocument()
    expect(screen.getByText("ftr")).toBeInTheDocument()
    expect(screen.getByText("content")).toBeInTheDocument()
  })

  it("keeps the canonical scrolling body with p-4 padding", () => {
    render(<MobileWrapper>content</MobileWrapper>)
    const main = screen.getByRole("main")
    expect(main.className).toContain("p-4")
    expect(main.className).toContain("overflow-y-auto")
  })

  it("forwards className onto the scrolling body", () => {
    render(
      <MobileWrapper className="flex flex-col items-center">x</MobileWrapper>
    )
    expect(screen.getByRole("main").className).toContain("items-center")
  })

  it("re-exports the header and footer slot sub-components", () => {
    expect(LogoHeader).toBeTypeOf("function")
    expect(BackTitleHeader).toBeTypeOf("function")
    expect(NavFooter).toBeTypeOf("function")
    expect(PrimaryCTAFooter).toBeTypeOf("function")
    expect(DualActionFooter).toBeTypeOf("function")
  })
})
