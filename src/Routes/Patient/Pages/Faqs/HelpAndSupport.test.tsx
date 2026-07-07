import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import HelpAndSupport from "./HelpAndSupport"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// PatientPageWrapper pulls in the shell + stepper; stub it to a passthrough so
// this test stays focused on the FAQ item wiring.
vi.mock("../PatientPageWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

const renderScreen = () =>
  render(
    <MemoryRouter>
      <HelpAndSupport />
    </MemoryRouter>
  )

describe("Faqs/HelpAndSupport invoice-problem items", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it("routes the invoice-details-mismatch item to its guide", () => {
    renderScreen()
    fireEvent.click(
      screen.getByText("The details don't match the invoice uploaded")
    )
    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/payment/request-payment/help/invoice-details-mismatch"
    )
  })

  it("routes the downloaded-files item to the existing guide route", () => {
    renderScreen()
    fireEvent.click(
      screen.getByText("How to find downloaded files on your phone")
    )
    expect(mockNavigate).toHaveBeenCalledWith("/patients/faqs/downloaded-files")
  })

  it("routes the invoice-validity item to its guide", () => {
    renderScreen()
    fireEvent.click(screen.getByText("Invoice is not valid?"))
    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/payment/request-payment/help/invoice-validity"
    )
  })

  it("renders its section titles as <h2> headings (SectionTitle, not muted <h2> with a colour override)", () => {
    renderScreen()
    const invoiceSection = screen.getByRole("heading", {
      level: 2,
      name: "Have a problem with your invoice?",
    })
    const helpSection = screen.getByRole("heading", {
      level: 2,
      name: "Need more help?",
    })
    // SectionTitle inherits base heading styles — no per-call colour override.
    expect(invoiceSection.className).not.toContain("text-muted-foreground")
    expect(helpSection.className).not.toContain("text-muted-foreground")
  })

  it("keeps the real support contact links (tel/sms/wa)", () => {
    renderScreen()
    // Contact items are real links, not console.log stubs.
    expect(screen.getByText("Call Jireh Support")).toBeInTheDocument()
    expect(screen.getByText("Send an SMS")).toBeInTheDocument()
    expect(screen.getByText("Send a WhatsApp message")).toBeInTheDocument()
  })
})
