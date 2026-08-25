// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { EmergencyCardStaticFallback } from "./EmergencyCardStaticFallback"

describe("EmergencyCardStaticFallback", () => {
  it("renders all three emergency numbers as tel: links", () => {
    render(<EmergencyCardStaticFallback />)

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(3)

    expect(screen.getByText("999")).toBeInTheDocument()
    expect(screen.getByText("112")).toBeInTheDocument()
    expect(screen.getByText("0800 723 253")).toBeInTheDocument()
  })

  it("has correct tel: href values with spaces removed", () => {
    render(<EmergencyCardStaticFallback />)

    expect(screen.getByText("999").closest("a")).toHaveAttribute(
      "href",
      "tel:999",
    )
    expect(screen.getByText("112").closest("a")).toHaveAttribute(
      "href",
      "tel:112",
    )
    expect(screen.getByText("0800 723 253").closest("a")).toHaveAttribute(
      "href",
      "tel:0800723253",
    )
  })

  it("renders the GENERAL condition label", () => {
    render(<EmergencyCardStaticFallback />)
    expect(
      screen.getByText(/GENERAL/, { exact: false }),
    ).toBeInTheDocument()
  })

  it("renders the Emergency Contacts heading", () => {
    render(<EmergencyCardStaticFallback />)
    expect(
      screen.getByRole("heading", { name: "Emergency Contacts" }),
    ).toBeInTheDocument()
  })

  it("has role=alert with an accessible label", () => {
    render(<EmergencyCardStaticFallback />)
    const alert = screen.getByRole("alert")
    expect(alert).toHaveAttribute("aria-label", "Emergency contacts")
  })

  it("uses font-mono on the phone number links", () => {
    render(<EmergencyCardStaticFallback />)
    const links = screen.getAllByRole("link")
    for (const link of links) {
      expect(link.className).toContain("font-mono")
    }
  })

  it("uses destructive palette tokens for styling", () => {
    render(<EmergencyCardStaticFallback />)
    const alert = screen.getByRole("alert")
    expect(alert.className).toContain("border-destructive/30")
    expect(alert.className).toContain("bg-destructive/5")

    const links = screen.getAllByRole("link")
    for (const link of links) {
      expect(link.className).toContain("text-destructive")
    }
  })

  it("renders each emergency number with its descriptive label", () => {
    render(<EmergencyCardStaticFallback />)
    expect(screen.getByText("Emergency (Kenya)")).toBeInTheDocument()
    expect(
      screen.getByText("Emergency (International)"),
    ).toBeInTheDocument()
    expect(screen.getByText("Kenya Red Cross")).toBeInTheDocument()
  })
})
