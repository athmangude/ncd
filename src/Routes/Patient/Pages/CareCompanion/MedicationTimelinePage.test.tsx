// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockEntries = [
  {
    date: "2026-08-05",
    medicationName: "Metformin 500mg",
    dosage: "500mg",
    quantity: 60,
    lineTotal: "480",
    facilityName: "Mombasa Hospital Pharmacy",
    gapDaysFromPrevious: 30,
    isGapAnomaly: false,
  },
  {
    date: "2026-08-02",
    medicationName: "Amlodipine 5mg",
    dosage: "5mg",
    quantity: 30,
    lineTotal: "320",
    facilityName: "City Chemist Mombasa",
    gapDaysFromPrevious: 28,
    isGapAnomaly: false,
  },
  {
    date: "2026-07-06",
    medicationName: "Metformin 500mg",
    dosage: "500mg",
    quantity: 60,
    lineTotal: "480",
    facilityName: "Mombasa Hospital Pharmacy",
    gapDaysFromPrevious: 29,
    isGapAnomaly: false,
  },
  {
    date: "2026-04-29",
    medicationName: "Aspirin 75mg",
    dosage: "75mg",
    quantity: 30,
    lineTotal: "150",
    facilityName: "City Chemist Mombasa",
    gapDaysFromPrevious: 60,
    isGapAnomaly: true,
  },
]

const mockSummary = {
  totalMedications: 3,
  pharmaciesUsed: 2,
  dateRange: { from: "2025-12-18", to: "2026-08-05" },
}

const mockPagination = { total: 24, limit: 20, offset: 0 }

const mockUseMedicationTimeline = vi.fn((): {
  data:
    | {
        entries: typeof mockEntries
        summary: typeof mockSummary
        pagination: typeof mockPagination
      }
    | undefined
  isLoading: boolean
  error: Error | null
  isFetching: boolean
} => ({
  data: {
    entries: mockEntries,
    summary: mockSummary,
    pagination: mockPagination,
  },
  isLoading: false,
  error: null,
  isFetching: false,
}))

vi.mock("./hooks/useMedicationTimeline", () => ({
  useMedicationTimeline: () => mockUseMedicationTimeline(),
}))

// ---------------------------------------------------------------------------
// Mock store
// ---------------------------------------------------------------------------

const mockSetActiveMedicationFilter = vi.fn()
let mockActiveMedicationFilter: string | null = null

vi.mock("./store/careCompanionStore", () => ({
  useCareCompanionStore: () => ({
    activeMedicationFilter: mockActiveMedicationFilter,
    setActiveMedicationFilter: mockSetActiveMedicationFilter,
  }),
}))

// ---------------------------------------------------------------------------
// Mock analytics
// ---------------------------------------------------------------------------

const mockTrackEvent = vi.fn()
vi.mock("@/analytics", () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  EVENTS: {
    CARE_COMPANION: {
      MEDICATION_TIMELINE: {
        VIEW: "CARE_COMPANION:MedicationTimeline:view",
        FILTER_CHANGE: "CARE_COMPANION:MedicationTimeline:filter-change",
      },
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import MedicationTimelinePage from "./MedicationTimelinePage"

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MedicationTimelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActiveMedicationFilter = null
    mockUseMedicationTimeline.mockReturnValue({
      data: {
        entries: mockEntries,
        summary: mockSummary,
        pagination: mockPagination,
      },
      isLoading: false,
      error: null,
      isFetching: false,
    })
  })

  describe("loading state", () => {
    it("shows a loading spinner when data is loading", () => {
      mockUseMedicationTimeline.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isFetching: true,
      })
      render(wrap(<MedicationTimelinePage />))
      expect(document.querySelector(".animate-spin")).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("shows error message when query fails", () => {
      mockUseMedicationTimeline.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
        isFetching: false,
      })
      render(wrap(<MedicationTimelinePage />))
      expect(
        screen.getByText("Could not load your medication history.")
      ).toBeInTheDocument()
    })
  })

  describe("empty state", () => {
    it("shows empty state when there is no data", () => {
      mockUseMedicationTimeline.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        isFetching: false,
      })
      render(wrap(<MedicationTimelinePage />))
      expect(
        screen.getByText(/No medication purchases recorded yet/)
      ).toBeInTheDocument()
    })
  })

  describe("summary header", () => {
    it("renders the summary header with medication and pharmacy counts", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(screen.getByText("Purchase History")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
    })

    it("renders the date range", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(
        screen.getByText("18 Dec 2025 - 5 Aug 2026")
      ).toBeInTheDocument()
    })
  })

  describe("timeline entries", () => {
    it("renders medication names", () => {
      render(wrap(<MedicationTimelinePage />))
      // 2 in entries + 1 in filter chip = 3
      expect(screen.getAllByText("Metformin 500mg")).toHaveLength(3)
      // 1 in entry + 1 in filter chip = 2
      expect(screen.getAllByText("Amlodipine 5mg")).toHaveLength(2)
      // 1 in entry + 1 in filter chip = 2
      expect(screen.getAllByText("Aspirin 75mg")).toHaveLength(2)
    })

    it("renders facility names", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(
        screen.getAllByText("Mombasa Hospital Pharmacy")
      ).toHaveLength(2)
      // City Chemist appears on Amlodipine and Aspirin entries
      expect(
        screen.getAllByText("City Chemist Mombasa")
      ).toHaveLength(2)
    })

    it("renders amounts in KES with font-mono", () => {
      render(wrap(<MedicationTimelinePage />))
      const amounts = screen.getAllByText(/^KES/)
      expect(amounts.length).toBeGreaterThan(0)
      amounts.forEach((el) => {
        expect(el.className).toContain("font-mono")
      })
    })

    it("shows gap anomaly warning when isGapAnomaly is true", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(
        screen.getByText("60-day gap since previous purchase")
      ).toBeInTheDocument()
    })
  })

  describe("month grouping", () => {
    it("groups entries by month with headers", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(screen.getByText(/August 2026/)).toBeInTheDocument()
      expect(screen.getByText(/July 2026/)).toBeInTheDocument()
      expect(screen.getByText(/April 2026/)).toBeInTheDocument()
    })
  })

  describe("medication filter chips", () => {
    it("renders filter chips for unique medications", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(screen.getByText("All")).toBeInTheDocument()
      // Medication filter chip names (distinct from entry names which appear multiple times)
      const filterButtons = screen.getAllByRole("button")
      const chipLabels = filterButtons
        .filter((btn) => btn.classList.contains("rounded-full"))
        .map((btn) => btn.textContent)
      expect(chipLabels).toContain("All")
      expect(chipLabels).toContain("Amlodipine 5mg")
      expect(chipLabels).toContain("Aspirin 75mg")
      expect(chipLabels).toContain("Metformin 500mg")
    })

    it("calls setActiveMedicationFilter when a chip is tapped", () => {
      render(wrap(<MedicationTimelinePage />))
      const filterButtons = screen.getAllByRole("button")
      const metforminChip = filterButtons.find(
        (btn) =>
          btn.textContent === "Metformin 500mg" &&
          btn.classList.contains("rounded-full")
      )
      expect(metforminChip).toBeDefined()
      fireEvent.click(metforminChip!)
      expect(mockSetActiveMedicationFilter).toHaveBeenCalledWith(
        "Metformin 500mg"
      )
    })

    it("calls setActiveMedicationFilter(null) when All chip is tapped", () => {
      mockActiveMedicationFilter = "Metformin 500mg"
      render(wrap(<MedicationTimelinePage />))
      const filterButtons = screen.getAllByRole("button")
      const allChip = filterButtons.find(
        (btn) =>
          btn.textContent === "All" &&
          btn.classList.contains("rounded-full")
      )
      fireEvent.click(allChip!)
      expect(mockSetActiveMedicationFilter).toHaveBeenCalledWith(null)
    })
  })

  describe("load more", () => {
    it("shows Load more button when there are more items", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(screen.getByText("Load more")).toBeInTheDocument()
    })

    it("does not show Load more when all items are loaded", () => {
      mockUseMedicationTimeline.mockReturnValue({
        data: {
          entries: mockEntries,
          summary: mockSummary,
          pagination: { total: 4, limit: 20, offset: 0 },
        },
        isLoading: false,
        error: null,
        isFetching: false,
      })
      render(wrap(<MedicationTimelinePage />))
      expect(screen.queryByText("Load more")).not.toBeInTheDocument()
    })

    it("shows loading state on Load more button when fetching", () => {
      mockUseMedicationTimeline.mockReturnValue({
        data: {
          entries: mockEntries,
          summary: mockSummary,
          pagination: mockPagination,
        },
        isLoading: false,
        error: null,
        isFetching: true,
      })
      render(wrap(<MedicationTimelinePage />))
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })
  })

  describe("analytics", () => {
    it("fires MEDICATION_TIMELINE.VIEW on mount", () => {
      render(wrap(<MedicationTimelinePage />))
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:MedicationTimeline:view"
      )
    })

    it("fires MEDICATION_TIMELINE.FILTER_CHANGE when a filter chip is tapped", () => {
      render(wrap(<MedicationTimelinePage />))
      const filterButtons = screen.getAllByRole("button")
      const aspirinChip = filterButtons.find(
        (btn) =>
          btn.textContent === "Aspirin 75mg" &&
          btn.classList.contains("rounded-full")
      )
      fireEvent.click(aspirinChip!)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:MedicationTimeline:filter-change",
        { medication: "Aspirin 75mg" }
      )
    })

    it("fires FILTER_CHANGE with 'all' when All chip is tapped", () => {
      render(wrap(<MedicationTimelinePage />))
      const filterButtons = screen.getAllByRole("button")
      const allChip = filterButtons.find(
        (btn) =>
          btn.textContent === "All" &&
          btn.classList.contains("rounded-full")
      )
      fireEvent.click(allChip!)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:MedicationTimeline:filter-change",
        { medication: "all" }
      )
    })
  })
})
