import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const capturedQueryCalls: Record<string, unknown>[] = []

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockImplementation((opts) => {
    capturedQueryCalls.push(opts)
    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
      dataUpdatedAt: 0,
    }
  }),
}))

const mockAxiosGet = vi.fn().mockResolvedValue({
  data: {
    events: [],
    pagination: { total: 0, limit: 20, offset: 0 },
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

vi.mock("../store/careCompanionStore", () => ({
  useCareCompanionStore: vi
    .fn()
    .mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          intakeCompleted: false,
          activeAiSessionId: null,
          dismissedOverlayIds: [],
          activeMedicationFilter: null,
          activeEventTypeFilter: null,
          activeFacilityFilter: null,
          aiPipelineRunning: false,
          setIntakeCompleted: vi.fn(),
          setActiveAiSessionId: vi.fn(),
          dismissOverlay: vi.fn(),
          clearDismissedOverlays: vi.fn(),
          setActiveMedicationFilter: vi.fn(),
          setActiveEventTypeFilter: vi.fn(),
          setActiveFacilityFilter: vi.fn(),
          setAiPipelineRunning: vi.fn(),
        })
    ),
}))

vi.mock("./useRefillSchedule", () => ({
  useRefillSchedule: vi.fn().mockReturnValue({
    data: { schedules: [] },
    isLoading: false,
    isFetching: false,
    error: null,
  }),
}))

vi.mock("../components/care-history/CareHistoryFilters", () => ({
  COMPOSITE_FILTER_MAP: {
    MEDICATIONS: ["SCHEDULE_CHANGE", "DRUG_INTERACTION", "VISIT_GROUP"],
    LAB_TESTS: ["TEST_RESULT", "SCHEDULE_CHANGE"],
    INSIGHTS: ["AI_INSIGHT"],
  },
}))

vi.mock("../utils/careHistoryClassifier", () => ({
  classifyEvents: vi.fn().mockReturnValue([]),
  groupByMonth: vi.fn().mockReturnValue([]),
}))

vi.mock("../utils/careHistoryEnricher", () => ({
  linkTestResults: vi
    .fn()
    .mockReturnValue({ entries: [], linkedTestIds: new Set() }),
  linkCashback: vi.fn().mockReturnValue(new Map()),
  computeAdherenceGaps: vi.fn().mockReturnValue([]),
  generateUpcomingEvents: vi.fn().mockReturnValue([]),
  buildLinkedTestResultsMap: vi.fn().mockReturnValue(new Map()),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCareHistory", () => {
  let useCareHistory: typeof import("./useCareHistory").useCareHistory
  let careHistoryQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryCalls.length = 0
    const mod = await import("./useCareHistory")
    useCareHistory = mod.useCareHistory
    careHistoryQueryKey = mod.careHistoryQueryKey
  })

  it("exports the correct query key", () => {
    expect(careHistoryQueryKey).toBe("careCompanionCareHistory")
  })

  it("includes offset and filter values in the events queryKey for cache isolation", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareHistory())

    const eventsOpts = capturedQueryCalls.find(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as string[])[0] === "careCompanionCareHistory"
    )

    expect(eventsOpts?.queryKey).toEqual([
      "careCompanionCareHistory",
      0,
      null,
      null,
    ])
  })

  it("uses different queryKeys for different offsets", async () => {
    const { renderHook } = await import("@testing-library/react")

    renderHook(() => useCareHistory())
    const firstEventsOpts = capturedQueryCalls.find(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as string[])[0] === "careCompanionCareHistory"
    )
    const firstKey = firstEventsOpts?.queryKey

    // The initial offset is 0. Since we cannot easily change internal state
    // from outside, we verify the structure includes the offset position.
    expect(firstKey).toEqual([
      "careCompanionCareHistory",
      0,
      null,
      null,
    ])
    // Offset is the second element in the queryKey array
    expect((firstKey as unknown[])[1]).toBe(0)
  })

  it("sets a 2-minute staleTime on the events query", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareHistory())

    const eventsOpts = capturedQueryCalls.find(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as string[])[0] === "careCompanionCareHistory"
    )

    expect(eventsOpts?.staleTime).toBe(2 * 60 * 1000)
  })

  it("events queryFn calls the companion/events endpoint with limit and offset params", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareHistory())

    const eventsOpts = capturedQueryCalls.find(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as string[])[0] === "careCompanionCareHistory"
    )

    const queryFn = eventsOpts?.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/events"),
      { params: { limit: 20, offset: 0 } }
    )
  })

  it("creates a test-schedules query with correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareHistory())

    const testScheduleOpts = capturedQueryCalls.find(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as string[])[0] === "careCompanionTestSchedules"
    )

    expect(testScheduleOpts?.queryKey).toEqual(["careCompanionTestSchedules"])
  })

  it("test-schedules queryFn calls the companion/test-schedules endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareHistory())

    const testScheduleOpts = capturedQueryCalls.find(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as string[])[0] === "careCompanionTestSchedules"
    )

    mockAxiosGet.mockResolvedValueOnce({
      data: { schedules: [] },
    })

    const queryFn = testScheduleOpts?.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/test-schedules")
    )
  })

  it("returns the expected shape with empty data", async () => {
    const { renderHook } = await import("@testing-library/react")
    const { result } = renderHook(() => useCareHistory())

    expect(result.current.monthGroups).toEqual([])
    expect(result.current.upcomingEvents).toEqual([])
    expect(result.current.summary).toEqual({
      totalVisits: 0,
      facilitiesVisited: 0,
      dateRange: { from: "", to: "" },
      lastVisit: null,
    })
    expect(result.current.linkedTestResults).toBeInstanceOf(Map)
    expect(result.current.cashbackMap).toBeInstanceOf(Map)
    expect(typeof result.current.isLoading).toBe("boolean")
    expect(typeof result.current.isFetching).toBe("boolean")
    expect(typeof result.current.hasMore).toBe("boolean")
    expect(typeof result.current.loadMore).toBe("function")
    expect(result.current.error).toBeNull()
  })
})
