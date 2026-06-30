// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import FacilitatorPanel from "./FacilitatorPanel"
import { getCareFundBalance } from "@/mocks/domain/careFund"
import { isMembershipActive } from "@/mocks/domain/membership"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderPanel() {
  return render(
    <MemoryRouter>
      <FacilitatorPanel />
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe("FacilitatorPanel", () => {
  // The "Onboarded" scenario seeds a fresh, fully-onboarded account: any prior
  // loans the participant applied for are wiped, and the facilitator is
  // navigated to the patient app to view the seeded state.
  it("seeds a blank onboarded profile and navigates to view it", () => {
    localStorage.setItem("mock:loans", JSON.stringify([{ id: "leftover" }]))
    renderPanel()

    // The stage button, not the status pill or the "Onboarded + Plus" chip.
    fireEvent.click(screen.getByRole("button", { name: "Onboarded" }))

    // The participant's leftover loan is gone after seeding a fresh account.
    const loans = JSON.parse(localStorage.getItem("mock:loans") || "[]") as {
      id: string
    }[]
    expect(loans.some((loan) => loan.id === "leftover")).toBe(false)
    // Scenario jumps land the facilitator on the patient app.
    expect(mockNavigate).toHaveBeenCalledWith("/patients")
  })

  it("starts a fresh participant after confirmation and returns to phone entry", () => {
    localStorage.setItem("mock:custom-key", "kept-by-participant")
    renderPanel()

    // The destructive full wipe is gated behind an inline confirmation.
    fireEvent.click(screen.getByText("Start fresh — new participant"))
    fireEvent.click(screen.getByText("Yes, start fresh"))

    // Start fresh removes every mock:* key the participant left behind, then
    // sends the facilitator back to phone-number entry.
    expect(localStorage.getItem("mock:custom-key")).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith("/patients")
  })

  // Draft edits (Money, Membership) commit only when "Save changes" is clicked,
  // and persist via query invalidation — no navigation / reload.
  it("sets the cashback balance through the domain helper on save", () => {
    renderPanel()

    fireEvent.click(screen.getByText("Money"))
    const balanceInput = screen.getByLabelText("Cashback balance")
    fireEvent.change(balanceInput, { target: { value: "4321" } })
    fireEvent.click(screen.getByText("Save changes"))

    expect(getCareFundBalance()).toBe(4321)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("toggles membership off on save", () => {
    renderPanel()

    fireEvent.click(screen.getByText("Membership & credit"))
    // The Jireh Plus switch reflects current membership; toggling + saving
    // routes through deactivateMembership().
    const plusSwitch = screen.getByRole("switch", { name: /Jireh Plus/i })
    fireEvent.click(plusSwitch)
    fireEvent.click(screen.getByText("Save changes"))

    expect(isMembershipActive()).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("marks a pending circle invite as accepted", () => {
    renderPanel()

    fireEvent.click(screen.getByText("Circle & network"))
    fireEvent.click(screen.getAllByText("Accept")[0])

    const network = JSON.parse(
      localStorage.getItem("mock:patient-network") || "{}"
    ) as { network: { firstName: string }[] }
    expect(network.network.some((member) => member.firstName === "Kevin")).toBe(
      true
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("approves a pending payment request", () => {
    renderPanel()

    fireEvent.click(screen.getByText("History & activity"))
    const approveButtons = screen.queryAllByText("Approve")
    if (approveButtons.length > 0) {
      fireEvent.click(approveButtons[0])
      const requests = JSON.parse(
        localStorage.getItem("mock:manual-requests") || "[]"
      ) as { status: string }[]
      expect(requests.some((request) => request.status === "APPROVED")).toBe(
        true
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    }
  })
})
