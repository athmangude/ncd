import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SectionTitle } from "./SectionTitle"

describe("SectionTitle", () => {
  it("defaults to an <h2> (one level below the page <h1>, no outline skip)", () => {
    render(<SectionTitle>Payment History</SectionTitle>)
    const el = screen.getByRole("heading", { name: "Payment History" })
    expect(el.tagName).toBe("H2")
  })

  it("renders an <h3> when level is 3 (nested subsection)", () => {
    render(<SectionTitle level={3}>Sub-section</SectionTitle>)
    const el = screen.getByRole("heading", { name: "Sub-section" })
    expect(el.tagName).toBe("H3")
  })

  it("does not inject type/colour classes (inherits base heading styles)", () => {
    render(<SectionTitle>Bare</SectionTitle>)
    const el = screen.getByRole("heading", { name: "Bare" })
    expect(el.className).not.toMatch(/text-(xs|sm|base|lg|xl|foreground|muted)/)
    expect(el.className).not.toMatch(/font-(normal|medium|semibold|bold)/)
  })

  it("merges a layout-only className", () => {
    render(<SectionTitle className="flex-1 truncate">Titled</SectionTitle>)
    const el = screen.getByRole("heading", { name: "Titled" })
    expect(el.className).toContain("flex-1")
    expect(el.className).toContain("truncate")
  })

  it("forwards an id for aria labelling", () => {
    render(<SectionTitle id="discounts-heading">Discounts</SectionTitle>)
    const el = screen.getByRole("heading", { name: "Discounts" })
    expect(el.id).toBe("discounts-heading")
  })
})
