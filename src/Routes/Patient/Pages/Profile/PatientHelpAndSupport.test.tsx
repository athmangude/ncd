import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import PatientHelpAndSupport from "./PatientHelpAndSupport"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// PatientPageWrapper drags in the shell; stub it to a passthrough so this test
// stays focused on the support-option wiring.
vi.mock("@/Routes/Patient/Pages/PatientPageWrapper", () => ({
  default: ({
    children,
    footer,
  }: {
    children: React.ReactNode
    footer?: React.ReactNode
  }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}))

vi.mock("@/Routes/shell/footers", () => ({
  PrimaryCTAFooter: () => null,
  DualActionFooter: () => null,
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { SUPPORT: { VIEW: "SUPPORT:Main:view", CONTACT_SUBMIT: "x" } },
}))

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe("PatientHelpAndSupport", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it("navigates to the in-app FAQ list instead of opening the marketing site", () => {
    render(
      <MemoryRouter>
        <PatientHelpAndSupport />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("FAQs"))
    expect(mockNavigate).toHaveBeenCalledWith("/patients/faqs")
  })

  it("renders each support option as an outline Item row", () => {
    render(
      <MemoryRouter>
        <PatientHelpAndSupport />
      </MemoryRouter>
    )
    const faqRow = screen.getByText("FAQs").closest("[data-slot='item']")
    expect(faqRow).not.toBeNull()
    expect(faqRow).toHaveAttribute("data-variant", "outline")
  })
})
