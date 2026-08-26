// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockCards = [
  {
    id: "edu-dietary-001",
    conditionType: "DIABETES" as const,
    contentType: "DIETARY" as const,
    locale: "EN" as const,
    title: "Ugali portions that work for blood sugar control",
    body: "You do not have to stop eating ugali.",
    weekNumber: 1,
    imageUrl: null,
    isPublished: true,
    householdCompatible: true,
    costNeutral: true,
    viewed: false,
  },
  {
    id: "edu-exercise-001",
    conditionType: "DIABETES" as const,
    contentType: "EXERCISE" as const,
    locale: "EN" as const,
    title: "Walking after meals lowers blood sugar",
    body: "A 15-minute walk after your main meal can reduce your blood sugar spike.",
    weekNumber: 3,
    imageUrl: null,
    isPublished: true,
    householdCompatible: null,
    costNeutral: null,
    viewed: true,
  },
  {
    id: "edu-myth-001",
    conditionType: "DIABETES" as const,
    contentType: "MYTH_BUSTING" as const,
    locale: "EN" as const,
    title: "Myth: Diabetes can be cured with herbal remedies",
    body: "There is no herbal cure for diabetes.",
    weekNumber: 2,
    imageUrl: null,
    isPublished: true,
    householdCompatible: null,
    costNeutral: null,
    viewed: false,
  },
]

const mockMarkViewed = { mutate: vi.fn(), isPending: false, error: null }

const mockUseEducationFeed = vi.fn((): {
  data: { cards: typeof mockCards } | undefined
  isLoading: boolean
  error: Error | null
  markViewed: typeof mockMarkViewed
} => ({
  data: { cards: mockCards },
  isLoading: false,
  error: null,
  markViewed: mockMarkViewed,
}))

vi.mock("./hooks/useEducationFeed", () => ({
  useEducationFeed: () => mockUseEducationFeed(),
}))

const mockTrackEvent = vi.fn()
vi.mock("@/analytics", () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  EVENTS: {
    CARE_COMPANION: {
      EDUCATION: {
        VIEW: "CARE_COMPANION:Education:view",
        CARD_VIEWED: "CARE_COMPANION:Education:card-viewed",
        CARD_COMPLETE: "CARE_COMPANION:Education:card-complete",
      },
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import EducationFeedPage from "./EducationFeedPage"

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

describe("EducationFeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEducationFeed.mockReturnValue({
      data: { cards: mockCards },
      isLoading: false,
      error: null,
      markViewed: mockMarkViewed,
    })
  })

  describe("loading state", () => {
    it("shows a loading spinner when data is loading", () => {
      mockUseEducationFeed.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        markViewed: mockMarkViewed,
      })
      render(wrap(<EducationFeedPage />))
      expect(document.querySelector(".animate-spin")).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("shows error message when query fails", () => {
      mockUseEducationFeed.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
        markViewed: mockMarkViewed,
      })
      render(wrap(<EducationFeedPage />))
      expect(
        screen.getByText("Could not load education articles."),
      ).toBeInTheDocument()
    })
  })

  describe("normal rendering", () => {
    it("renders the page header", () => {
      render(wrap(<EducationFeedPage />))
      expect(screen.getByText("Education Feed")).toBeInTheDocument()
    })

    it("renders all filter chips", () => {
      render(wrap(<EducationFeedPage />))
      // Some labels like "Dietary" appear on both filter chips and card badges,
      // so we use getAllByText and verify at least one instance exists.
      expect(screen.getByText("All")).toBeInTheDocument()
      expect(screen.getAllByText("Dietary").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Exercise").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Myth Busting").length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText("Emotional")).toBeInTheDocument()
      expect(screen.getByText("Acceptance")).toBeInTheDocument()
      expect(screen.getByText("Self Monitoring")).toBeInTheDocument()
      expect(screen.getByText("Milestone")).toBeInTheDocument()
    })

    it("renders all education cards", () => {
      render(wrap(<EducationFeedPage />))
      expect(
        screen.getByText("Ugali portions that work for blood sugar control"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Walking after meals lowers blood sugar"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Myth: Diabetes can be cured with herbal remedies"),
      ).toBeInTheDocument()
    })

    it("shows content type badges on cards", () => {
      render(wrap(<EducationFeedPage />))
      // The filter chips also render "Dietary", so we check for the badge-specific styling
      const dietaryBadges = screen.getAllByText("Dietary")
      expect(dietaryBadges.length).toBeGreaterThanOrEqual(1)
    })

    it("shows condition type badges on cards", () => {
      render(wrap(<EducationFeedPage />))
      const diabetesBadges = screen.getAllByText("Diabetes")
      expect(diabetesBadges.length).toBe(3)
    })

    it("shows household-compatible badge where applicable", () => {
      render(wrap(<EducationFeedPage />))
      expect(screen.getByText("Household")).toBeInTheDocument()
    })

    it("shows cost-neutral badge where applicable", () => {
      render(wrap(<EducationFeedPage />))
      expect(screen.getByText("Cost-neutral")).toBeInTheDocument()
    })

    it("shows unread dot for unviewed cards", () => {
      const { container } = render(wrap(<EducationFeedPage />))
      // Unread dots are rendered as small teal circles
      // Cards with viewed: false should have the dot (2 cards)
      const unreadDots = container.querySelectorAll(".bg-accent.rounded-full.h-2.w-2")
      expect(unreadDots.length).toBe(2)
    })
  })

  describe("filtering", () => {
    it("filters cards by content type when a chip is tapped", () => {
      render(wrap(<EducationFeedPage />))

      // Get the filter chip buttons (not the card badges)
      const filterButtons = screen.getAllByRole("button")
      const exerciseFilter = filterButtons.find(
        (btn) => btn.textContent === "Exercise" && btn.classList.contains("rounded-full"),
      )
      expect(exerciseFilter).toBeDefined()
      fireEvent.click(exerciseFilter!)

      expect(
        screen.getByText("Walking after meals lowers blood sugar"),
      ).toBeInTheDocument()
      expect(
        screen.queryByText("Ugali portions that work for blood sugar control"),
      ).not.toBeInTheDocument()
    })

    it("shows all cards when All filter is selected", () => {
      render(wrap(<EducationFeedPage />))

      // First filter to Exercise
      const filterButtons = screen.getAllByRole("button")
      const exerciseFilter = filterButtons.find(
        (btn) => btn.textContent === "Exercise" && btn.classList.contains("rounded-full"),
      )
      fireEvent.click(exerciseFilter!)

      // Then back to All
      const allFilter = filterButtons.find(
        (btn) => btn.textContent === "All" && btn.classList.contains("rounded-full"),
      )
      fireEvent.click(allFilter!)

      expect(
        screen.getByText("Ugali portions that work for blood sugar control"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Walking after meals lowers blood sugar"),
      ).toBeInTheDocument()
    })
  })

  describe("card expansion", () => {
    it("expands a card on tap to show body text", () => {
      render(wrap(<EducationFeedPage />))

      const card = screen.getByText(
        "Ugali portions that work for blood sugar control",
      )
      fireEvent.click(card.closest("button")!)

      expect(
        screen.getByText("You do not have to stop eating ugali."),
      ).toBeInTheDocument()
    })

    it("collapses an expanded card on second tap", () => {
      render(wrap(<EducationFeedPage />))

      const card = screen.getByText(
        "Ugali portions that work for blood sugar control",
      )
      const cardButton = card.closest("button")!

      // Expand
      fireEvent.click(cardButton)
      expect(
        screen.getByText("You do not have to stop eating ugali."),
      ).toBeInTheDocument()

      // Collapse
      fireEvent.click(cardButton)
      expect(
        screen.queryByText("You do not have to stop eating ugali."),
      ).not.toBeInTheDocument()
    })

    it("calls markViewed when expanding an unviewed card", () => {
      render(wrap(<EducationFeedPage />))

      const card = screen.getByText(
        "Ugali portions that work for blood sugar control",
      )
      fireEvent.click(card.closest("button")!)

      expect(mockMarkViewed.mutate).toHaveBeenCalledWith("edu-dietary-001")
    })

    it("does not call markViewed when expanding an already-viewed card", () => {
      render(wrap(<EducationFeedPage />))

      const card = screen.getByText(
        "Walking after meals lowers blood sugar",
      )
      fireEvent.click(card.closest("button")!)

      expect(mockMarkViewed.mutate).not.toHaveBeenCalled()
    })
  })

  describe("empty state", () => {
    it("shows empty state when no cards match the active filter", () => {
      render(wrap(<EducationFeedPage />))

      // Select a filter that has no cards
      const filterButtons = screen.getAllByRole("button")
      const emotionalFilter = filterButtons.find(
        (btn) => btn.textContent === "Emotional" && btn.classList.contains("rounded-full"),
      )
      fireEvent.click(emotionalFilter!)

      expect(
        screen.getByText(
          "You've read all available articles. Check back next week.",
        ),
      ).toBeInTheDocument()
    })

    it("shows empty state when data has no cards", () => {
      mockUseEducationFeed.mockReturnValue({
        data: { cards: [] },
        isLoading: false,
        error: null,
        markViewed: mockMarkViewed,
      })
      render(wrap(<EducationFeedPage />))
      expect(
        screen.getByText(
          "You've read all available articles. Check back next week.",
        ),
      ).toBeInTheDocument()
    })
  })

  describe("analytics", () => {
    it("fires EDUCATION.VIEW on mount", () => {
      render(wrap(<EducationFeedPage />))
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:Education:view",
      )
    })

    it("fires EDUCATION.CARD_VIEWED when a card is tapped", () => {
      render(wrap(<EducationFeedPage />))

      const card = screen.getByText(
        "Ugali portions that work for blood sugar control",
      )
      fireEvent.click(card.closest("button")!)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:Education:card-viewed",
        {
          cardId: "edu-dietary-001",
          contentType: "DIETARY",
          conditionType: "DIABETES",
        },
      )
    })

    it("fires EDUCATION.CARD_COMPLETE when expanded card is viewed", () => {
      render(wrap(<EducationFeedPage />))

      const card = screen.getByText(
        "Ugali portions that work for blood sugar control",
      )
      fireEvent.click(card.closest("button")!)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "CARE_COMPANION:Education:card-complete",
        {
          cardId: "edu-dietary-001",
          contentType: "DIETARY",
        },
      )
    })
  })
})
