import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { DashboardStickyFooter } from "./DashboardStickyFooter"

vi.mock("../../../hooks/useNextKYCStep", () => ({
  KYC_START_URL: "/patients/kyc-setup-intro",
}))

const wrap = (ui: React.ReactNode) => <MemoryRouter>{ui}</MemoryRouter>

describe("DashboardStickyFooter", () => {
  it("renders the Pay Medical Bill bar aligned to the tab bar width (max-w-md)", () => {
    render(
      wrap(
        <DashboardStickyFooter
          hasActiveMembership
          activeTab="payments"
          canPayMedicalBill
          onPayMedicalBill={vi.fn()}
        />
      )
    )

    const button = screen.getByRole("button", { name: "Pay Medical Bill" })
    // The floating bar must match the tab bar's max-w-md (not the old
    // max-w-[450px], which was 2px wider and left a seam) and carry a top
    // border so scrolling content reads as sitting behind a distinct bar
    // rather than being clipped.
    const bar = button.closest("div.fixed")
    expect(bar?.className).toContain("max-w-md")
    expect(bar?.className).not.toContain("max-w-[450px]")
    expect(bar?.className).toContain("border-t")
  })

  it("renders the upgrade bar aligned to the tab bar width (max-w-md)", () => {
    render(
      wrap(
        <DashboardStickyFooter
          hasActiveMembership={false}
          activeTab="cashback"
          canPayMedicalBill={false}
          onPayMedicalBill={vi.fn()}
        />
      )
    )

    const button = screen.getByRole("button", {
      name: "Upgrade Now to Unlock",
    })
    const bar = button.closest("div.fixed")
    expect(bar?.className).toContain("max-w-md")
    expect(bar?.className).not.toContain("max-w-[450px]")
  })

  it("renders nothing when there is no applicable sticky action", () => {
    const { container } = render(
      wrap(
        <DashboardStickyFooter
          hasActiveMembership={false}
          activeTab="payments"
          canPayMedicalBill={false}
          onPayMedicalBill={vi.fn()}
        />
      )
    )
    expect(container).toBeEmptyDOMElement()
  })
})
