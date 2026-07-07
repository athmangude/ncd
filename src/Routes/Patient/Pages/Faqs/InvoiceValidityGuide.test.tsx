import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import InvoiceValidityGuide from "./InvoiceValidityGuide"

vi.mock("../PatientPageWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

describe("InvoiceValidityGuide", () => {
  it("renders the question as the page heading", () => {
    render(<InvoiceValidityGuide />)
    const heading = screen.getByRole("heading", {
      name: "Invoice is not valid?",
    })
    expect(heading.tagName).toBe("H1")
  })
})
