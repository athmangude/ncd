import { describe, it, expect, vi, beforeEach } from "vitest"
import type {
  CareCompanionEvent,
  PaymentEvent,
  TestResultEvent,
  CashbackEarnedEvent,
  LlmActionEvent,
  DrugInteractionDetectedEvent,
  RefillScheduleChangeEvent,
  RefillScheduleItem,
  TestScheduleItem,
} from "@/types/care-companion"

// ---------------------------------------------------------------------------
// This suite exercises the REAL classification/enrichment pipeline
// (careHistoryClassifier + careHistoryEnricher + CareHistoryFilters) with
// realistic fixture events. Unlike useCareHistory.test.ts (which mocks the
// pipeline to verify query wiring), this file verifies the business logic:
// filtering, summary stats, pagination accumulation, and error propagation.
// Only useQuery, axios, the Zustand store, and useRefillSchedule are mocked.
// ---------------------------------------------------------------------------

interface QueryState {
  data: unknown
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  dataUpdatedAt: number
}

function makeQueryState(overrides: Partial<QueryState> = {}): QueryState {
  return {
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: null,
    dataUpdatedAt: 0,
    ...overrides,
  }
}

let eventsQueryState: QueryState = makeQueryState()
let testScheduleQueryState: QueryState = makeQueryState({
  data: { schedules: [] },
})
const capturedQueryCalls: Record<string, unknown>[] = []

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockImplementation((opts: Record<string, unknown>) => {
    capturedQueryCalls.push(opts)
    const key = (opts.queryKey as unknown[])[0]
    if (key === "careCompanionCareHistory") return eventsQueryState
    if (key === "careCompanionTestSchedules") return testScheduleQueryState
    return makeQueryState()
  }),
}))

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}))

interface StoreState {
  activeEventTypeFilter: string | null
  activeFacilityFilter: string | null
}

let storeState: StoreState = {
  activeEventTypeFilter: null,
  activeFacilityFilter: null,
}

vi.mock("../store/careCompanionStore", () => ({
  useCareCompanionStore: vi
    .fn()
    .mockImplementation((selector: (s: StoreState) => unknown) =>
      selector(storeState)
    ),
}))

interface RefillQueryState {
  data: { schedules: RefillScheduleItem[] } | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
}

let refillQueryState: RefillQueryState = {
  data: { schedules: [] },
  isLoading: false,
  isFetching: false,
  error: null,
}

vi.mock("./useRefillSchedule", () => ({
  useRefillSchedule: vi.fn().mockImplementation(() => refillQueryState),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const visitAPayment: PaymentEvent = {
  id: "pay-1",
  type: "PAYMENT",
  timestamp: "2026-01-05T10:00:00Z",
  source: "user",
  facilityName: "Nairobi Hospital",
  facilityType: "HOSPITAL",
  totalAmount: 5000,
  currency: "KES",
  lineItems: [
    {
      name: "Blood Glucose Test",
      category: "LAB_TEST",
      quantity: 1,
      unitPrice: 1000,
      lineTotal: 1000,
    },
  ],
  fundingSources: [{ type: "WALLET", amount: 5000 }],
  isInNetwork: true,
}

const linkedTestResult: TestResultEvent = {
  id: "test-1",
  type: "TEST_RESULT",
  timestamp: "2026-01-10T10:00:00Z",
  source: "user",
  testName: "Blood Glucose Test",
  scheduleId: null,
  metrics: [],
  aiInsights: null,
}

const cashbackForVisitA: CashbackEarnedEvent = {
  id: "cb-1",
  type: "CASHBACK_EARNED",
  timestamp: "2026-01-05T10:05:00Z",
  source: "system",
  paymentEventId: "pay-1",
  amount: 250,
  currency: "KES",
  rate: 0.05,
  newBalance: 1250,
}

const visitBPayment: PaymentEvent = {
  id: "pay-2",
  type: "PAYMENT",
  timestamp: "2026-02-01T09:00:00Z",
  source: "user",
  facilityName: "Mombasa Clinic",
  facilityType: "CLINIC",
  totalAmount: 2000,
  currency: "KES",
  lineItems: [
    {
      name: "Consultation",
      category: "CONSULTATION",
      quantity: 1,
      unitPrice: 2000,
      lineTotal: 2000,
    },
  ],
  fundingSources: [{ type: "MPESA", amount: 2000 }],
  isInNetwork: true,
}

const aiInsight: LlmActionEvent = {
  id: "ai-1",
  type: "LLM_ACTION",
  timestamp: "2026-01-15T00:00:00Z",
  source: "llm",
  actionType: "REFILL_NUDGE",
  title: "Refill reminder",
  body: "Metformin refill is due soon",
  severity: "INFO",
  relatedMedication: "Metformin 500mg",
  relatedScheduleId: "sched-1",
  inputHash: "hash-1",
  dismissed: false,
}

const drugInteraction: DrugInteractionDetectedEvent = {
  id: "di-1",
  type: "DRUG_INTERACTION_DETECTED",
  timestamp: "2026-01-20T00:00:00Z",
  source: "system",
  medicationA: "Metformin",
  medicationB: "Aspirin",
  herbName: null,
  severity: "MODERATE",
  clinicalEffect: "Increased hypoglycemia risk",
  recommendation: "Monitor blood sugar closely",
}

const scheduleChange: RefillScheduleChangeEvent = {
  id: "rsc-1",
  type: "REFILL_SCHEDULE_CHANGE",
  timestamp: "2026-01-25T00:00:00Z",
  source: "system",
  scheduleId: "sched-1",
  medicationName: "Metformin 500mg",
  conditions: [],
  statusAtChange: "DUE",
  daysUntilRefillAtChange: 5,
  previousFrequencyDays: 30,
  newFrequencyDays: 30,
  previousNextDate: "2026-01-20",
  newNextDate: "2026-02-19",
  reason: "Adjusted based on adherence",
  reasonCategory: "ADHERENCE",
  estimatedCostPerRefill: null,
}

// Excluded event type -- must never surface in the timeline output.
const loanDisbursed: CareCompanionEvent = {
  id: "loan-1",
  type: "LOAN_DISBURSED",
  timestamp: "2026-01-01T00:00:00Z",
  source: "user",
  loanId: "loan-1",
  amount: 10000,
  currency: "KES",
  purpose: "Medication",
  targetFacility: "Nairobi Hospital",
  medications: ["Metformin 500mg"],
  repaymentSchedule: {
    totalRepayments: 4,
    amountPerRepayment: 2500,
    cadence: "WEEKLY",
    firstDueDate: "2026-01-08",
  },
}

const allFixtureEvents: CareCompanionEvent[] = [
  visitAPayment,
  linkedTestResult,
  cashbackForVisitA,
  visitBPayment,
  aiInsight,
  drugInteraction,
  scheduleChange,
  loanDisbursed,
]

const overdueRefillSchedule: RefillScheduleItem = {
  id: "sched-overdue-1",
  medicationName: "Amlodipine 5mg",
  expectedRefillDate: "2026-01-02",
  status: "OVERDUE",
  daysUntilRefill: -10,
  estimatedDaysSupply: 30,
  escalatedToLoanOffer: false,
}

const upcomingRefillSchedule: RefillScheduleItem = {
  id: "sched-upcoming-1",
  medicationName: "Losartan 50mg",
  expectedRefillDate: "2026-03-01",
  status: "UPCOMING",
  daysUntilRefill: 15,
  estimatedDaysSupply: 30,
  escalatedToLoanOffer: false,
}

const upcomingTestSchedule: TestScheduleItem = {
  id: "test-sched-1",
  testName: "HbA1c",
  expectedDate: "2026-03-10",
  status: "UPCOMING",
  daysUntilTest: 20,
  frequencyMonths: 3,
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe("useCareHistory (real pipeline)", () => {
  let useCareHistory: typeof import("./useCareHistory").useCareHistory
  let renderHook: typeof import("@testing-library/react").renderHook
  let act: typeof import("@testing-library/react").act

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryCalls.length = 0
    eventsQueryState = makeQueryState()
    testScheduleQueryState = makeQueryState({ data: { schedules: [] } })
    storeState = { activeEventTypeFilter: null, activeFacilityFilter: null }
    refillQueryState = {
      data: { schedules: [] },
      isLoading: false,
      isFetching: false,
      error: null,
    }

    const mod = await import("./useCareHistory")
    useCareHistory = mod.useCareHistory
    const rtl = await import("@testing-library/react")
    renderHook = rtl.renderHook
    act = rtl.act
  })

  // -------------------------------------------------------------------
  // Classification + enrichment happy path
  // -------------------------------------------------------------------

  it("classifies events into month groups, excluding untracked event types", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: allFixtureEvents,
        pagination: { total: allFixtureEvents.length, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())

    const allEntries = result.current.monthGroups.flatMap((g) => g.entries)
    const allTypes = allEntries.map((e) => e.type)

    // Two visit groups, an AI insight, a drug interaction, a schedule change.
    expect(allTypes.filter((t) => t === "VISIT_GROUP")).toHaveLength(2)
    expect(allTypes).toContain("AI_INSIGHT")
    expect(allTypes).toContain("DRUG_INTERACTION")
    expect(allTypes).toContain("SCHEDULE_CHANGE")

    // LOAN_DISBURSED is an excluded event type and must not surface.
    expect(allEntries.find((e) => e.id === "loan-1")).toBeUndefined()

    // The TEST_RESULT is linked to visit A (matching LAB_TEST line item
    // within the 14-day window) so it should NOT appear as a standalone entry.
    expect(allTypes).not.toContain("TEST_RESULT")
  })

  it("links the test result to the visit group and exposes it via linkedTestResults", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: allFixtureEvents,
        pagination: { total: allFixtureEvents.length, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())

    expect(result.current.linkedTestResults.get("blood glucose test")).toEqual(
      linkedTestResult
    )
  })

  it("builds the cashback map keyed by paymentEventId", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: allFixtureEvents,
        pagination: { total: allFixtureEvents.length, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())

    expect(result.current.cashbackMap.get("pay-1")).toEqual({
      amount: 250,
      rate: 0.05,
    })
    expect(result.current.cashbackMap.has("pay-2")).toBe(false)
  })

  // -------------------------------------------------------------------
  // Summary stats
  // -------------------------------------------------------------------

  it("computes summary stats (totalVisits, facilitiesVisited, dateRange, lastVisit)", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: allFixtureEvents,
        pagination: { total: allFixtureEvents.length, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())

    expect(result.current.summary.totalVisits).toBe(2)
    expect(result.current.summary.facilitiesVisited).toBe(2)
    // loan-1 (2026-01-01) is an excluded event type, so the earliest date in
    // the classified (non-excluded) entries is visit A's 2026-01-05.
    expect(result.current.summary.dateRange).toEqual({
      from: "2026-01-05",
      to: "2026-02-01",
    })
    expect(result.current.summary.lastVisit).toEqual({
      date: "2026-02-01",
      facilityName: "Mombasa Clinic",
    })
  })

  it("returns zeroed summary and empty groups when there are no events", () => {
    eventsQueryState = makeQueryState({
      data: { events: [], pagination: { total: 0, limit: 20, offset: 0 } },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())

    expect(result.current.monthGroups).toEqual([])
    expect(result.current.summary).toEqual({
      totalVisits: 0,
      facilitiesVisited: 0,
      dateRange: { from: "", to: "" },
      lastVisit: null,
    })
  })

  // -------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------

  it("filters entries by a direct event type, keeping UPCOMING entries unaffected", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: allFixtureEvents,
        pagination: { total: allFixtureEvents.length, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })
    refillQueryState = {
      data: { schedules: [upcomingRefillSchedule] },
      isLoading: false,
      isFetching: false,
      error: null,
    }
    storeState = {
      activeEventTypeFilter: "VISIT_GROUP",
      activeFacilityFilter: null,
    }

    const { result } = renderHook(() => useCareHistory())

    const timelineTypes = result.current.monthGroups
      .flatMap((g) => g.entries)
      .map((e) => e.type)

    expect(timelineTypes.every((t) => t === "VISIT_GROUP")).toBe(true)
    expect(result.current.upcomingEvents.length).toBeGreaterThan(0)
  })

  it("filters entries by the MEDICATIONS composite filter", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: allFixtureEvents,
        pagination: { total: allFixtureEvents.length, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })
    storeState = {
      activeEventTypeFilter: "MEDICATIONS",
      activeFacilityFilter: null,
    }

    const { result } = renderHook(() => useCareHistory())

    const timelineTypes = result.current.monthGroups
      .flatMap((g) => g.entries)
      .map((e) => e.type)

    // MEDICATIONS maps to SCHEDULE_CHANGE, DRUG_INTERACTION, VISIT_GROUP.
    expect(timelineTypes).toContain("SCHEDULE_CHANGE")
    expect(timelineTypes).toContain("DRUG_INTERACTION")
    expect(timelineTypes).toContain("VISIT_GROUP")
    expect(timelineTypes).not.toContain("AI_INSIGHT")
  })

  it("filters entries by facility name", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: allFixtureEvents,
        pagination: { total: allFixtureEvents.length, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })
    storeState = {
      activeEventTypeFilter: null,
      activeFacilityFilter: "Nairobi Hospital",
    }

    const { result } = renderHook(() => useCareHistory())

    const visitEntries = result.current.monthGroups
      .flatMap((g) => g.entries)
      .filter((e) => e.type === "VISIT_GROUP")

    expect(visitEntries).toHaveLength(1)
    expect(visitEntries[0].facilityName).toBe("Nairobi Hospital")

    // Non-visit entries (facilityName === null) survive the facility filter.
    const nonVisitTypes = result.current.monthGroups
      .flatMap((g) => g.entries)
      .filter((e) => e.facilityName === null)
      .map((e) => e.type)
    expect(nonVisitTypes.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------
  // Adherence gaps + upcoming events
  // -------------------------------------------------------------------

  it("adds an adherence gap entry for an overdue refill schedule with no matching payment, even when there are no companion events yet", () => {
    eventsQueryState = makeQueryState({
      data: { events: [], pagination: { total: 0, limit: 20, offset: 0 } },
      dataUpdatedAt: 1,
    })
    refillQueryState = {
      data: { schedules: [overdueRefillSchedule] },
      isLoading: false,
      isFetching: false,
      error: null,
    }

    const { result } = renderHook(() => useCareHistory())

    const allEntries = result.current.monthGroups.flatMap((g) => g.entries)
    const gap = allEntries.find((e) => e.type === "ADHERENCE_GAP")

    expect(gap).toBeDefined()
    expect(gap?.title).toBe("Amlodipine 5mg|10")
  })

  it("generates upcoming events from refill and test schedules even when there are no companion events yet", () => {
    eventsQueryState = makeQueryState({
      data: { events: [], pagination: { total: 0, limit: 20, offset: 0 } },
      dataUpdatedAt: 1,
    })
    refillQueryState = {
      data: { schedules: [upcomingRefillSchedule] },
      isLoading: false,
      isFetching: false,
      error: null,
    }
    testScheduleQueryState = makeQueryState({
      data: { schedules: [upcomingTestSchedule] },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())

    expect(result.current.upcomingEvents).toHaveLength(2)
    expect(
      result.current.upcomingEvents.map((e) => e.title)
    ).toEqual(
      expect.arrayContaining([
        "Losartan 50mg refill due",
        "HbA1c due",
      ])
    )
  })

  // -------------------------------------------------------------------
  // Pagination: hasMore + loadMore + accumulation
  // -------------------------------------------------------------------

  it("reports hasMore true when more pages remain, false once all pages are loaded", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: [visitAPayment],
        pagination: { total: 40, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())
    expect(result.current.hasMore).toBe(true)
  })

  it("loadMore advances the offset and accumulates events across pages", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: [visitAPayment],
        pagination: { total: 40, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())
    expect(result.current.hasMore).toBe(true)
    expect(result.current.summary.totalVisits).toBe(1)

    // Simulate the second page arriving after loadMore triggers a refetch.
    eventsQueryState = makeQueryState({
      data: {
        events: [visitBPayment],
        pagination: { total: 40, limit: 20, offset: 20 },
      },
      dataUpdatedAt: 2,
    })

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.summary.totalVisits).toBe(2)
    expect(result.current.hasMore).toBe(false)

    const eventsCalls = capturedQueryCalls.filter(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as unknown[])[0] === "careCompanionCareHistory"
    )
    const lastCall = eventsCalls[eventsCalls.length - 1]
    expect((lastCall.queryKey as unknown[])[1]).toBe(20)
  })

  it("does not advance the offset when hasMore is false", () => {
    eventsQueryState = makeQueryState({
      data: {
        events: [visitAPayment],
        pagination: { total: 1, limit: 20, offset: 0 },
      },
      dataUpdatedAt: 1,
    })

    const { result } = renderHook(() => useCareHistory())
    expect(result.current.hasMore).toBe(false)

    act(() => {
      result.current.loadMore()
    })

    const eventsCalls = capturedQueryCalls.filter(
      (opts) =>
        Array.isArray(opts.queryKey) &&
        (opts.queryKey as unknown[])[0] === "careCompanionCareHistory"
    )
    const lastCall = eventsCalls[eventsCalls.length - 1]
    expect((lastCall.queryKey as unknown[])[1]).toBe(0)
  })

  // -------------------------------------------------------------------
  // Loading / fetching / error aggregation (error paths)
  // -------------------------------------------------------------------

  it("aggregates isLoading across the events, refill, and test-schedule queries", () => {
    testScheduleQueryState = makeQueryState({
      data: { schedules: [] },
      isLoading: true,
    })

    const { result } = renderHook(() => useCareHistory())
    expect(result.current.isLoading).toBe(true)
  })

  it("surfaces an error from the events query", () => {
    const boom = new Error("events fetch failed")
    eventsQueryState = makeQueryState({ error: boom })

    const { result } = renderHook(() => useCareHistory())
    expect(result.current.error).toBe(boom)
  })

  it("surfaces an error from the refill schedule query", () => {
    const boom = new Error("refill fetch failed")
    refillQueryState = {
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: boom,
    }

    const { result } = renderHook(() => useCareHistory())
    expect(result.current.error).toBe(boom)
  })

  it("surfaces an error from the test-schedule query", () => {
    const boom = new Error("test schedule fetch failed")
    testScheduleQueryState = makeQueryState({ error: boom })

    const { result } = renderHook(() => useCareHistory())
    expect(result.current.error).toBe(boom)
  })
})
