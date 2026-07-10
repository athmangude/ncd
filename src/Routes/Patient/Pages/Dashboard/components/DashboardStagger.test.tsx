import { describe, it, expect, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { DashboardStagger, DashboardSection } from "./DashboardStagger"

const originalMatchMedia = window.matchMedia

function mockReducedMotion(prefersReduced: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion")
        ? prefersReduced
        : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

describe("DashboardStagger / DashboardSection", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it("renders children for the intro mode", () => {
    mockReducedMotion(false)
    render(
      <DashboardStagger mode="intro">
        <DashboardSection mode="intro">Section content</DashboardSection>
      </DashboardStagger>
    )
    expect(screen.getByText("Section content")).toBeInTheDocument()
  })

  it("renders children for the switch mode", () => {
    mockReducedMotion(false)
    render(
      <DashboardStagger mode="switch">
        <DashboardSection mode="switch">Switch content</DashboardSection>
      </DashboardStagger>
    )
    expect(screen.getByText("Switch content")).toBeInTheDocument()
  })

  it("falls back to a plain div (no motion) when prefers-reduced-motion is set", () => {
    mockReducedMotion(true)
    const { container } = render(
      <DashboardStagger mode="intro" className="stagger-root">
        <DashboardSection mode="intro" className="section-root">
          Reduced motion content
        </DashboardSection>
      </DashboardStagger>
    )
    expect(screen.getByText("Reduced motion content")).toBeInTheDocument()
    expect(container.querySelector(".stagger-root")?.tagName).toBe("DIV")
    expect(container.querySelector(".section-root")?.tagName).toBe("DIV")
  })
})
