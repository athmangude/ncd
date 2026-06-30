import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DashboardTabs } from "./DashboardTabs"

describe("DashboardTabs", () => {
  it("renders the payments, loans and cashback triggers", () => {
    render(<DashboardTabs activeTab="payments" onTabChange={() => {}} />)
    expect(screen.getByRole("tab", { name: /payments/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /loans/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /cashback/i })).toBeInTheDocument()
  })

  it("marks the active tab as selected", () => {
    render(<DashboardTabs activeTab="loans" onTabChange={() => {}} />)
    expect(screen.getByRole("tab", { name: /loans/i })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByRole("tab", { name: /payments/i })).toHaveAttribute(
      "aria-selected",
      "false"
    )
  })

  it("calls onTabChange with the selected tab value on click", async () => {
    const onTabChange = vi.fn()
    render(<DashboardTabs activeTab="payments" onTabChange={onTabChange} />)
    await userEvent.click(screen.getByRole("tab", { name: /cashback/i }))
    expect(onTabChange).toHaveBeenCalledWith("cashback")
  })
})
