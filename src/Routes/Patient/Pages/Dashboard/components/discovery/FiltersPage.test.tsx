import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"

const navigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => navigate }
})

vi.mock("./useDiscovery", () => ({
  DISCOVERY_STORAGE_KEY: "discovery-filters",
}))
vi.mock("./api/useServiceCategories", () => ({
  useServiceCategories: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))
vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    DISCOVERY: {
      FILTERS_OPEN: "filters_open",
      FILTERS_APPLY: "filters_apply",
    },
  },
}))

import FiltersPage from "./FiltersPage"

const wrap = (ui: ReactNode) => createElement(MemoryRouter, null, ui)

describe("FiltersPage (AppShell migration)", () => {
  it("renders the header and dual-action footer inside the shell", () => {
    render(wrap(<FiltersPage />))
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Filters" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Apply filters" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("renders the Services section label as a heading", () => {
    render(wrap(<FiltersPage />))
    const heading = screen.getByRole("heading", { name: "Services" })
    expect(heading.tagName).toBe("H2")
  })

  it("navigates back when Apply is tapped", () => {
    navigate.mockClear()
    render(wrap(<FiltersPage />))
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }))
    expect(navigate).toHaveBeenCalledWith(-1)
  })
})
