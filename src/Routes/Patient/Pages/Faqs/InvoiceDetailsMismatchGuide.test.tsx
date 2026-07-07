import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import InvoiceDetailsMismatchGuide from "./InvoiceDetailsMismatchGuide"

vi.mock("../PatientPageWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

describe("InvoiceDetailsMismatchGuide", () => {
  it("renders the question as the page heading", () => {
    render(<InvoiceDetailsMismatchGuide />)
    const heading = screen.getByRole("heading", {
      name: "The details don't match the invoice uploaded",
    })
    expect(heading.tagName).toBe("H1")
  })
})
