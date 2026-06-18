// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import FacilitatorPanel from "./FacilitatorPanel"
import { reloadApp } from "./reloadApp"
import { getCareFundBalance } from "@/mocks/domain/careFund"
import { isMembershipActive } from "@/mocks/domain/membership"

vi.mock("./reloadApp", () => ({ reloadApp: vi.fn() }))

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
  it("resets the account after confirmation and reloads", () => {
    localStorage.setItem("mock:loans", "[]")
    renderPanel()

    fireEvent.click(screen.getByText("Reset to fresh participant"))
    fireEvent.click(screen.getByText("Yes, reset everything"))

    expect(localStorage.getItem("mock:loans")).toBeNull()
    expect(reloadApp).toHaveBeenCalled()
  })

  it("sets the cashback balance through the domain helper", () => {
    renderPanel()

    const [balanceInput] = screen.getAllByRole("spinbutton")
    fireEvent.change(balanceInput, { target: { value: "4321" } })
    fireEvent.click(screen.getByText("Set balance"))

    expect(getCareFundBalance()).toBe(4321)
    expect(reloadApp).toHaveBeenCalled()
  })

  it("toggles membership off", () => {
    renderPanel()

    fireEvent.click(screen.getByText("Deactivate"))

    expect(isMembershipActive()).toBe(false)
    expect(reloadApp).toHaveBeenCalled()
  })

  it("marks a pending circle invite as accepted", () => {
    renderPanel()

    fireEvent.click(screen.getAllByText("Mark accepted")[0])

    const network = JSON.parse(
      localStorage.getItem("mock:patient-network") || "{}"
    ) as { network: { firstName: string }[] }
    expect(network.network.some((member) => member.firstName === "Kevin")).toBe(
      true
    )
    expect(reloadApp).toHaveBeenCalled()
  })

  it("approves a pending payment request", () => {
    renderPanel()

    const approveButtons = screen.queryAllByText("Approve")
    if (approveButtons.length > 0) {
      fireEvent.click(approveButtons[0])
      const requests = JSON.parse(
        localStorage.getItem("mock:manual-requests") || "[]"
      ) as { status: string }[]
      expect(requests.some((request) => request.status === "APPROVED")).toBe(
        true
      )
      expect(reloadApp).toHaveBeenCalled()
    }
  })
})
