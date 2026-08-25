import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Tabs } from "@radix-ui/react-tabs"
import PatientDashboardCareTab from "./PatientDashboardCareTab"

describe("PatientDashboardCareTab", () => {
  it("renders the Care Companion heading when tab is active", () => {
    render(
      <Tabs value="care">
        <PatientDashboardCareTab />
      </Tabs>
    )
    expect(
      screen.getByRole("heading", { name: /care companion/i })
    ).toBeInTheDocument()
  })

  it("renders the description text", () => {
    render(
      <Tabs value="care">
        <PatientDashboardCareTab />
      </Tabs>
    )
    expect(
      screen.getByText(/medication tracking, emergency cards/i)
    ).toBeInTheDocument()
  })

  it("does not render content when a different tab is active", () => {
    render(
      <Tabs value="home">
        <PatientDashboardCareTab />
      </Tabs>
    )
    expect(
      screen.queryByRole("heading", { name: /care companion/i })
    ).not.toBeInTheDocument()
  })
})
