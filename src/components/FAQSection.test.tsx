import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import FAQSection from "./FAQSection"

describe("FAQSection", () => {
  it("renders its title as a section heading (<h2>), not a bare paragraph", () => {
    render(<FAQSection title="Don't Have a Statement?" faqs={[]} />)
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Don't Have a Statement?",
    })
    expect(heading.tagName).toBe("H2")
  })

  it("renders each FAQ item's label", () => {
    render(
      <FAQSection
        title="Help"
        faqs={[{ label: "How do I upload?" }, { label: "What formats?" }]}
      />
    )
    expect(screen.getByText("How do I upload?")).toBeInTheDocument()
    expect(screen.getByText("What formats?")).toBeInTheDocument()
  })
})
