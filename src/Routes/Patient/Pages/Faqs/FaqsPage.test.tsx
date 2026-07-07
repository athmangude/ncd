import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import FaqsPage from "./FaqsPage"
import { memberFaqs } from "@/data/memberFaqs"

vi.mock("../PatientPageWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { SUPPORT: { FAQ_VIEW: "SUPPORT:Faq:view" } },
}))

describe("FaqsPage", () => {
  it("renders every FAQ category as a section heading", () => {
    render(<FaqsPage />)
    for (const category of memberFaqs) {
      expect(
        screen.getByRole("heading", { name: category.title })
      ).toBeInTheDocument()
    }
  })

  it("renders every FAQ question as an accordion trigger", () => {
    render(<FaqsPage />)
    const totalQuestions = memberFaqs.reduce((n, c) => n + c.items.length, 0)
    expect(screen.getAllByRole("button")).toHaveLength(totalQuestions)
    // Spot-check a known question is present.
    expect(screen.getByText("What is Jireh Health?")).toBeInTheDocument()
  })
})
