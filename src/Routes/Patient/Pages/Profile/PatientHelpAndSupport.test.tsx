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

// MobileWrapper drags in the shell; stub it (and its named slot exports) to a
// passthrough so this test stays focused on the support-option wiring.
vi.mock("@/Routes/MobileWrapper", () => ({
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
  BackTitleHeader: () => null,
  PrimaryCTAFooter: () => null,
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
})
