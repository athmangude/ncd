import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"

vi.mock("./useDiscovery", () => ({
  useDiscovery: () => ({
    filteredFacilities: [],
    searchQuery: "",
    setSearchQuery: vi.fn(),
    activeTab: "all",
    setActiveTab: vi.fn(),
    userLocation: null,
    locationName: "Nairobi",
    serviceCategories: [],
    setServiceCategories: vi.fn(),
  }),
}))
vi.mock("./api/useRecentSearches", () => ({
  useRecentSearches: () => ({ data: [], isLoading: false, isError: false }),
}))
vi.mock("./api/usePreferredProviders", () => ({
  usePreferredProviders: () => ({ data: [], isLoading: false, isError: false }),
}))
vi.mock("./api/useLogRecentSearch", () => ({
  useLogRecentSearch: () => ({ mutate: vi.fn() }),
}))
vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { DISCOVERY: { SEARCH_PAGE_VIEW: "search_view" } },
}))

import SearchPage from "./SearchPage"

const wrap = (ui: ReactNode) => createElement(MemoryRouter, null, ui)

describe("SearchPage (PatientPageWrapper)", () => {
  it("renders the canonical bar title + in-body search controls inside the shell", () => {
    render(wrap(<SearchPage />))
    expect(screen.getByRole("main")).toBeInTheDocument()
    // "Search" is now the canonical app-bar title (a <p> in StepperHeader),
    // and the search controls (title/input/toggle/chips) moved into the body.
    expect(screen.getByText("Search")).toBeInTheDocument()
    // The "Find care near you" SectionTitle (<h2>) is now a body element.
    expect(
      screen.getByRole("heading", { level: 2, name: "Find care near you" })
    ).toBeInTheDocument()
  })

  it("renders the Filter control as a secondary Chip when no filters are active", () => {
    render(wrap(<SearchPage />))
    expect(screen.getByRole("button", { name: /filter/i })).toHaveAttribute(
      "data-variant",
      "secondary"
    )
  })
})
