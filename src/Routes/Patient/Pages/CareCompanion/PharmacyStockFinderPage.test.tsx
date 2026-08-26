// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { PharmacyStock } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockStockData: PharmacyStock[] = [
  {
    facilityId: 103,
    facilityName: "City Chemist Mombasa",
    medicationName: "Metformin 500mg",
    status: "IN_STOCK",
    lastReportedAt: "2026-08-24T11:00:00Z",
    distance: 0.8,
    lat: -4.0453,
    lng: 39.6617,
  },
  {
    facilityId: 103,
    facilityName: "City Chemist Mombasa",
    medicationName: "Amlodipine 5mg",
    status: "OUT_OF_STOCK",
    lastReportedAt: "2026-08-22T16:45:00Z",
    distance: 0.8,
    lat: -4.0453,
    lng: 39.6617,
  },
  {
    facilityId: 101,
    facilityName: "Coast Chemist Mombasa",
    medicationName: "Metformin 500mg",
    status: "IN_STOCK",
    lastReportedAt: "2026-08-24T14:30:00Z",
    distance: 1.2,
    lat: -4.0435,
    lng: 39.6682,
  },
  {
    facilityId: 101,
    facilityName: "Coast Chemist Mombasa",
    medicationName: "Amlodipine 5mg",
    status: "IN_STOCK",
    lastReportedAt: "2026-08-24T14:30:00Z",
    distance: 1.2,
    lat: -4.0435,
    lng: 39.6682,
  },
  {
    facilityId: 203,
    facilityName: "Kenyatta Market Pharmacy Nairobi",
    medicationName: "Metformin 500mg",
    status: "OUT_OF_STOCK",
    lastReportedAt: "2026-08-23T11:00:00Z",
    distance: null,
    lat: -1.2985,
    lng: 36.8199,
  },
]

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUsePharmacyStock = vi.fn((): {
  data: PharmacyStock[] | undefined
  isLoading: boolean
  error: Error | null
} => ({
  data: mockStockData,
  isLoading: false,
  error: null,
}))

vi.mock("./hooks/usePharmacyStock", () => ({
  usePharmacyStock: () => mockUsePharmacyStock(),
}))

const mockTrackEvent = vi.fn()
vi.mock("@/analytics", () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  EVENTS: {
    CARE_COMPANION: {
      PHARMACY_STOCK: {
        VIEW: "CARE_COMPANION:PharmacyStock:view",
        SEARCH: "CARE_COMPANION:PharmacyStock:search",
      },
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import PharmacyStockFinderPage from "./PharmacyStockFinderPage"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrap(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUsePharmacyStock.mockReturnValue({
    data: mockStockData,
    isLoading: false,
    error: null,
  })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PharmacyStockFinderPage", () => {
  describe("loading state", () => {
    it("renders a loading spinner", () => {
      mockUsePharmacyStock.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })
      render(wrap(<PharmacyStockFinderPage />))
      expect(
        document.querySelector(".animate-spin"),
      ).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("renders an error message when fetch fails", () => {
      mockUsePharmacyStock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
      })
      render(wrap(<PharmacyStockFinderPage />))
      expect(
        screen.getByText("Could not load pharmacy stock information."),
      ).toBeInTheDocument()
    })
  })

  describe("empty state", () => {
    it("shows empty message when data is an empty array", () => {
      mockUsePharmacyStock.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })
      render(wrap(<PharmacyStockFinderPage />))
      expect(
        screen.getByText("No pharmacy stock data available"),
      ).toBeInTheDocument()
    })
  })

  describe("normal rendering", () => {
    it("groups items by pharmacy and shows pharmacy names", () => {
      render(wrap(<PharmacyStockFinderPage />))
      expect(
        screen.getByText("City Chemist Mombasa"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Coast Chemist Mombasa"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Kenyatta Market Pharmacy Nairobi"),
      ).toBeInTheDocument()
    })

    it("sorts pharmacies by distance, closest first", () => {
      render(wrap(<PharmacyStockFinderPage />))
      const pharmacyNames = screen
        .getAllByText(/Chemist|Pharmacy/)
        .filter((el) => el.classList.contains("truncate"))
        .map((el) => el.textContent)

      // City Chemist (0.8km), Coast Chemist (1.2km), Kenyatta (null=last)
      expect(pharmacyNames[0]).toBe("City Chemist Mombasa")
      expect(pharmacyNames[1]).toBe("Coast Chemist Mombasa")
      expect(pharmacyNames[2]).toBe("Kenyatta Market Pharmacy Nairobi")
    })

    it("shows distance for pharmacies with distance", () => {
      render(wrap(<PharmacyStockFinderPage />))
      expect(screen.getByText("0.8 km")).toBeInTheDocument()
      expect(screen.getByText("1.2 km")).toBeInTheDocument()
    })

    it("shows 'Distance unknown' for null distance", () => {
      render(wrap(<PharmacyStockFinderPage />))
      expect(screen.getByText("Distance unknown")).toBeInTheDocument()
    })

    it("renders stock status badges", () => {
      render(wrap(<PharmacyStockFinderPage />))
      const inStockBadges = screen.getAllByText("In stock")
      const outOfStockBadges = screen.getAllByText("Out of stock")
      expect(inStockBadges.length).toBeGreaterThanOrEqual(2)
      expect(outOfStockBadges.length).toBeGreaterThanOrEqual(1)
    })

    it("shows medication names within each pharmacy group", () => {
      render(wrap(<PharmacyStockFinderPage />))
      expect(screen.getAllByText("Metformin 500mg")).toHaveLength(3)
      expect(screen.getAllByText("Amlodipine 5mg")).toHaveLength(2)
    })

    it("renders a search input", () => {
      render(wrap(<PharmacyStockFinderPage />))
      expect(
        screen.getByLabelText("Search medications"),
      ).toBeInTheDocument()
    })
  })

  describe("search / filter", () => {
    it("filters pharmacies to only those with matching medication", async () => {
      const user = userEvent.setup()
      render(wrap(<PharmacyStockFinderPage />))

      const input = screen.getByLabelText("Search medications")
      await user.type(input, "Amlodipine")

      // City Chemist and Coast Chemist have Amlodipine; Kenyatta only has Metformin
      // But Kenyatta does NOT have Amlodipine in mock data, so it should disappear
      expect(
        screen.getByText("City Chemist Mombasa"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Coast Chemist Mombasa"),
      ).toBeInTheDocument()
      expect(
        screen.queryByText("Kenyatta Market Pharmacy Nairobi"),
      ).not.toBeInTheDocument()
    })

    it("shows empty state when search matches no medications", async () => {
      const user = userEvent.setup()
      render(wrap(<PharmacyStockFinderPage />))

      const input = screen.getByLabelText("Search medications")
      await user.type(input, "Ibuprofen")

      expect(
        screen.getByText("No pharmacies found with this medication"),
      ).toBeInTheDocument()
    })
  })

  describe("analytics", () => {
    it("tracks VIEW event on mount", () => {
      render(wrap(<PharmacyStockFinderPage />))
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:PharmacyStock:view",
      )
    })

    it("tracks SEARCH event on search input change", async () => {
      const user = userEvent.setup()
      render(wrap(<PharmacyStockFinderPage />))

      const input = screen.getByLabelText("Search medications")
      await user.type(input, "Met")

      // Should have been called for each character typed
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:PharmacyStock:search",
        expect.objectContaining({ query: expect.any(String) }),
      )
    })
  })
})
