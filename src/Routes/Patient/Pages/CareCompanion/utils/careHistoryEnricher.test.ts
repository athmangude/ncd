import { describe, it, expect } from "vitest"
import type {
  CareHistoryEntry,
  CareCompanionEvent,
  PaymentEvent,
  TestResultEvent,
  CashbackEarnedEvent,
  RefillScheduleItem,
  TestScheduleItem,
} from "@/types/care-companion"
import {
  linkTestResults,
  linkCashback,
  computeAdherenceGaps,
  generateUpcomingEvents,
  buildLinkedTestResultsMap,
  parseAdherenceGapTitle,
} from "./careHistoryEnricher"

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeVisitGroupEntry(overrides: Partial<CareHistoryEntry> & {
  paymentTimestamp?: string
  labTestName?: string
} = {}): CareHistoryEntry {
  const { paymentTimestamp, labTestName, ...rest } = overrides
  const payment: PaymentEvent = {
    id: "pay-1",
    type: "PAYMENT",
    timestamp: paymentTimestamp ?? "2025-06-15T10:00:00Z",
    source: "user",
    facilityName: "Nairobi Hospital",
    facilityType: "HOSPITAL",
    totalAmount: 5000,
    currency: "KES",
    lineItems: [
      {
        name: labTestName ?? "HbA1c",
        category: "LAB_TEST",
        quantity: 1,
        unitPrice: 3500,
        lineTotal: 3500,
      },
    ],
    fundingSources: [{ type: "WALLET", amount: 5000 }],
    isInNetwork: true,
  }

  return {
    id: "vg-1",
    type: "VISIT_GROUP",
    date: "2025-06-15",
    facilityName: "Nairobi Hospital",
    facilityType: "HOSPITAL",
    title: "Nairobi Hospital",
    sourceEvents: [payment],
    totalCost: 5000,
    fundingSources: ["WALLET"],
    ...rest,
  }
}

function makeTestResultEntry(overrides: Partial<CareHistoryEntry> & {
  testTimestamp?: string
  testName?: string
} = {}): CareHistoryEntry {
  const { testTimestamp, testName: tn, ...rest } = overrides
  const testEvent: TestResultEvent = {
    id: overrides.id ?? "tr-1",
    type: "TEST_RESULT",
    timestamp: testTimestamp ?? "2025-06-16T09:00:00Z",
    source: "user",
    testName: tn ?? "HbA1c",
    scheduleId: null,
    metrics: [
      {
        name: "HbA1c",
        value: 6.5,
        unit: "%",
        referenceRange: "4.0-5.6",
        status: "HIGH",
      },
    ],
    aiInsights: null,
  }

  return {
    id: testEvent.id,
    type: "TEST_RESULT",
    date: (testTimestamp ?? "2025-06-16T09:00:00Z").slice(0, 10),
    facilityName: null,
    facilityType: null,
    title: tn ?? "HbA1c",
    sourceEvents: [testEvent],
    totalCost: null,
    fundingSources: [],
    ...rest,
  }
}

function makeRefillSchedule(
  overrides: Partial<RefillScheduleItem> = {}
): RefillScheduleItem {
  return {
    id: "sched-1",
    medicationName: "Metformin",
    expectedRefillDate: "2025-06-01",
    status: "OVERDUE",
    daysUntilRefill: -10,
    estimatedDaysSupply: 30,
    escalatedToLoanOffer: false,
    ...overrides,
  }
}

function makeTestSchedule(
  overrides: Partial<TestScheduleItem> = {}
): TestScheduleItem {
  return {
    id: "tsched-1",
    testName: "HbA1c",
    expectedDate: "2025-07-15",
    status: "UPCOMING",
    daysUntilTest: 14,
    frequencyMonths: 3,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// linkTestResults
// ---------------------------------------------------------------------------

describe("linkTestResults", () => {
  it("links a test result to a visit group within 14 days", () => {
    const visitEntry = makeVisitGroupEntry({
      paymentTimestamp: "2025-06-15T10:00:00Z",
      labTestName: "HbA1c",
    })
    const testEntry = makeTestResultEntry({
      testTimestamp: "2025-06-16T09:00:00Z",
      testName: "HbA1c",
    })

    const entries = [visitEntry, testEntry]
    const result = linkTestResults(entries, [])

    expect(result.linkedTestIds.has(testEntry.id)).toBe(true)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].type).toBe("VISIT_GROUP")
  })

  it("links a test result exactly on day 14", () => {
    const visitEntry = makeVisitGroupEntry({
      paymentTimestamp: "2025-06-01T10:00:00Z",
      labTestName: "HbA1c",
    })
    const testEntry = makeTestResultEntry({
      testTimestamp: "2025-06-15T09:00:00Z",
      testName: "HbA1c",
    })

    const entries = [visitEntry, testEntry]
    const result = linkTestResults(entries, [])

    expect(result.linkedTestIds.has(testEntry.id)).toBe(true)
  })

  it("does NOT link a test result on day 15", () => {
    const visitEntry = makeVisitGroupEntry({
      paymentTimestamp: "2025-06-01T10:00:00Z",
      labTestName: "HbA1c",
    })
    // Use same hour as the payment so differenceInDays returns exactly 16
    // (full 24-hour periods). 15 full days past = June 16 at the same time.
    const testEntry = makeTestResultEntry({
      testTimestamp: "2025-06-16T10:00:00Z",
      testName: "HbA1c",
    })

    const entries = [visitEntry, testEntry]
    const result = linkTestResults(entries, [])

    expect(result.linkedTestIds.has(testEntry.id)).toBe(false)
    expect(result.entries).toHaveLength(2)
  })

  it("does NOT link a test result that precedes the payment", () => {
    const visitEntry = makeVisitGroupEntry({
      paymentTimestamp: "2025-06-15T10:00:00Z",
      labTestName: "HbA1c",
    })
    const testEntry = makeTestResultEntry({
      testTimestamp: "2025-06-14T09:00:00Z",
      testName: "HbA1c",
    })

    const entries = [visitEntry, testEntry]
    const result = linkTestResults(entries, [])

    expect(result.linkedTestIds.has(testEntry.id)).toBe(false)
  })

  it("performs case-insensitive name matching", () => {
    const visitEntry = makeVisitGroupEntry({
      paymentTimestamp: "2025-06-15T10:00:00Z",
      labTestName: "hba1c",
    })
    const testEntry = makeTestResultEntry({
      testTimestamp: "2025-06-16T09:00:00Z",
      testName: "HbA1c",
    })

    const entries = [visitEntry, testEntry]
    const result = linkTestResults(entries, [])

    expect(result.linkedTestIds.has(testEntry.id)).toBe(true)
  })

  it("does NOT link when test name does not match", () => {
    const visitEntry = makeVisitGroupEntry({
      paymentTimestamp: "2025-06-15T10:00:00Z",
      labTestName: "CBC",
    })
    const testEntry = makeTestResultEntry({
      testTimestamp: "2025-06-16T09:00:00Z",
      testName: "HbA1c",
    })

    const entries = [visitEntry, testEntry]
    const result = linkTestResults(entries, [])

    expect(result.linkedTestIds.has(testEntry.id)).toBe(false)
  })

  it("returns all entries unchanged when there are no test results", () => {
    const visitEntry = makeVisitGroupEntry()
    const entries = [visitEntry]
    const result = linkTestResults(entries, [])

    expect(result.entries).toHaveLength(1)
    expect(result.linkedTestIds.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// linkCashback
// ---------------------------------------------------------------------------

describe("linkCashback", () => {
  it("builds a map from paymentEventId to cashback data", () => {
    const cb: CashbackEarnedEvent = {
      id: "cb-1",
      type: "CASHBACK_EARNED",
      timestamp: "2025-06-15T10:01:00Z",
      source: "system",
      paymentEventId: "pay-1",
      amount: 125,
      currency: "KES",
      rate: 0.05,
      newBalance: 500,
    }

    const result = linkCashback([cb] as CareCompanionEvent[])
    expect(result.get("pay-1")).toEqual({ amount: 125, rate: 0.05 })
  })

  it("returns an empty map when there are no cashback events", () => {
    const result = linkCashback([])
    expect(result.size).toBe(0)
  })

  it("ignores non-cashback events", () => {
    const payment: PaymentEvent = {
      id: "pay-1",
      type: "PAYMENT",
      timestamp: "2025-06-15T10:00:00Z",
      source: "user",
      facilityName: "Hospital",
      facilityType: "HOSPITAL",
      totalAmount: 1000,
      currency: "KES",
      lineItems: [],
      fundingSources: [],
      isInNetwork: true,
    }
    const result = linkCashback([payment] as CareCompanionEvent[])
    expect(result.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeAdherenceGaps
// ---------------------------------------------------------------------------

describe("computeAdherenceGaps", () => {
  it("generates a gap entry for an overdue refill", () => {
    const schedules = [makeRefillSchedule()]
    const result = computeAdherenceGaps(schedules, [])

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("ADHERENCE_GAP")
    expect(result[0].id).toBe("gap-sched-1")
    expect(result[0].title).toBe("Metformin|10")
  })

  it("suppresses gap when a matching payment exists on/after the refill date", () => {
    const schedules = [
      makeRefillSchedule({ expectedRefillDate: "2025-06-01" }),
    ]
    const payments: PaymentEvent[] = [
      {
        id: "pay-1",
        type: "PAYMENT",
        timestamp: "2025-06-02T10:00:00Z",
        source: "user",
        facilityName: "Pharmacy",
        facilityType: "PHARMACY",
        totalAmount: 1200,
        currency: "KES",
        lineItems: [
          {
            name: "Metformin",
            category: "MEDICATION",
            quantity: 1,
            unitPrice: 1200,
            lineTotal: 1200,
          },
        ],
        fundingSources: [{ type: "WALLET", amount: 1200 }],
        isInNetwork: true,
      },
    ]

    const result = computeAdherenceGaps(schedules, payments)
    expect(result).toHaveLength(0)
  })

  it("does NOT suppress gap when payment is before the refill date", () => {
    const schedules = [
      makeRefillSchedule({ expectedRefillDate: "2025-06-10" }),
    ]
    const payments: PaymentEvent[] = [
      {
        id: "pay-1",
        type: "PAYMENT",
        timestamp: "2025-06-05T10:00:00Z",
        source: "user",
        facilityName: "Pharmacy",
        facilityType: "PHARMACY",
        totalAmount: 1200,
        currency: "KES",
        lineItems: [
          {
            name: "Metformin",
            category: "MEDICATION",
            quantity: 1,
            unitPrice: 1200,
            lineTotal: 1200,
          },
        ],
        fundingSources: [{ type: "WALLET", amount: 1200 }],
        isInNetwork: true,
      },
    ]

    const result = computeAdherenceGaps(schedules, payments)
    expect(result).toHaveLength(1)
  })

  it("does NOT suppress gap when payment medication name does not match", () => {
    const schedules = [
      makeRefillSchedule({ expectedRefillDate: "2025-06-01" }),
    ]
    const payments: PaymentEvent[] = [
      {
        id: "pay-1",
        type: "PAYMENT",
        timestamp: "2025-06-02T10:00:00Z",
        source: "user",
        facilityName: "Pharmacy",
        facilityType: "PHARMACY",
        totalAmount: 1200,
        currency: "KES",
        lineItems: [
          {
            name: "Amlodipine",
            category: "MEDICATION",
            quantity: 1,
            unitPrice: 1200,
            lineTotal: 1200,
          },
        ],
        fundingSources: [{ type: "WALLET", amount: 1200 }],
        isInNetwork: true,
      },
    ]

    const result = computeAdherenceGaps(schedules, payments)
    expect(result).toHaveLength(1)
  })

  it("skips non-overdue schedules", () => {
    const schedules = [
      makeRefillSchedule({ status: "UPCOMING", daysUntilRefill: 5 }),
    ]
    const result = computeAdherenceGaps(schedules, [])
    expect(result).toHaveLength(0)
  })

  it("skips overdue schedules with non-negative daysUntilRefill", () => {
    const schedules = [
      makeRefillSchedule({ status: "OVERDUE", daysUntilRefill: 0 }),
    ]
    const result = computeAdherenceGaps(schedules, [])
    expect(result).toHaveLength(0)
  })

  it("performs case-insensitive medication name matching for suppression", () => {
    const schedules = [
      makeRefillSchedule({
        medicationName: "metformin",
        expectedRefillDate: "2025-06-01",
      }),
    ]
    const payments: PaymentEvent[] = [
      {
        id: "pay-1",
        type: "PAYMENT",
        timestamp: "2025-06-02T10:00:00Z",
        source: "user",
        facilityName: "Pharmacy",
        facilityType: "PHARMACY",
        totalAmount: 1200,
        currency: "KES",
        lineItems: [
          {
            name: "METFORMIN",
            category: "MEDICATION",
            quantity: 1,
            unitPrice: 1200,
            lineTotal: 1200,
          },
        ],
        fundingSources: [{ type: "WALLET", amount: 1200 }],
        isInNetwork: true,
      },
    ]

    const result = computeAdherenceGaps(schedules, payments)
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// generateUpcomingEvents
// ---------------------------------------------------------------------------

describe("generateUpcomingEvents", () => {
  it("generates UPCOMING entries for future refills", () => {
    const refills = [
      makeRefillSchedule({
        status: "UPCOMING",
        daysUntilRefill: 5,
        expectedRefillDate: "2025-07-01",
      }),
    ]

    const result = generateUpcomingEvents(refills, [])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("UPCOMING")
    expect(result[0].title).toBe("Metformin refill due")
    expect(result[0].date).toBe("2025-07-01")
  })

  it("generates UPCOMING entries for future test schedules", () => {
    const tests = [makeTestSchedule()]

    const result = generateUpcomingEvents([], tests)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("UPCOMING")
    expect(result[0].title).toBe("HbA1c due")
  })

  it("filters out CANCELLED schedules", () => {
    const refills = [
      makeRefillSchedule({
        status: "CANCELLED",
        daysUntilRefill: 5,
      }),
    ]
    const tests = [makeTestSchedule({ status: "CANCELLED", daysUntilTest: 5 })]

    const result = generateUpcomingEvents(refills, tests)
    expect(result).toHaveLength(0)
  })

  it("filters out past-due items (daysUntilRefill <= 0)", () => {
    const refills = [
      makeRefillSchedule({ daysUntilRefill: 0, status: "DUE" }),
      makeRefillSchedule({
        id: "sched-2",
        daysUntilRefill: -5,
        status: "OVERDUE",
      }),
    ]

    const result = generateUpcomingEvents(refills, [])
    expect(result).toHaveLength(0)
  })

  it("filters out past-due test items (daysUntilTest <= 0)", () => {
    const tests = [makeTestSchedule({ daysUntilTest: 0 })]
    const result = generateUpcomingEvents([], tests)
    expect(result).toHaveLength(0)
  })

  it("sorts upcoming events by date ascending (nearest first)", () => {
    const refills = [
      makeRefillSchedule({
        id: "s1",
        medicationName: "B",
        expectedRefillDate: "2025-08-01",
        daysUntilRefill: 30,
        status: "UPCOMING",
      }),
      makeRefillSchedule({
        id: "s2",
        medicationName: "A",
        expectedRefillDate: "2025-07-01",
        daysUntilRefill: 10,
        status: "UPCOMING",
      }),
    ]

    const result = generateUpcomingEvents(refills, [])
    expect(result[0].date).toBe("2025-07-01")
    expect(result[1].date).toBe("2025-08-01")
  })

  it("combines and sorts refills and tests together", () => {
    const refills = [
      makeRefillSchedule({
        daysUntilRefill: 5,
        status: "UPCOMING",
        expectedRefillDate: "2025-07-20",
      }),
    ]
    const tests = [
      makeTestSchedule({
        daysUntilTest: 3,
        expectedDate: "2025-07-10",
      }),
    ]

    const result = generateUpcomingEvents(refills, tests)
    expect(result).toHaveLength(2)
    expect(result[0].date).toBe("2025-07-10")
    expect(result[1].date).toBe("2025-07-20")
  })
})

// ---------------------------------------------------------------------------
// parseAdherenceGapTitle
// ---------------------------------------------------------------------------

describe("parseAdherenceGapTitle", () => {
  it("parses a valid pipe-delimited title", () => {
    const result = parseAdherenceGapTitle("Metformin|10")
    expect(result).toEqual({ medicationName: "Metformin", daysOverdue: 10 })
  })

  it("returns null for a title without a pipe", () => {
    expect(parseAdherenceGapTitle("Metformin")).toBeNull()
  })

  it("returns null for a title with a non-numeric days value", () => {
    expect(parseAdherenceGapTitle("Metformin|abc")).toBeNull()
  })

  it("returns null for a title with too many parts", () => {
    expect(parseAdherenceGapTitle("A|B|C")).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// buildLinkedTestResultsMap
// ---------------------------------------------------------------------------

describe("buildLinkedTestResultsMap", () => {
  it("builds a map keyed by lowercase test name", () => {
    const testEntry = makeTestResultEntry({ testName: "HbA1c" })
    const linkedIds = new Set([testEntry.id])

    const result = buildLinkedTestResultsMap(linkedIds, [testEntry])
    expect(result.get("hba1c")).toBeDefined()
    expect(result.get("hba1c")?.testName).toBe("HbA1c")
  })

  it("returns an empty map when linkedTestIds is empty", () => {
    const result = buildLinkedTestResultsMap(new Set(), [])
    expect(result.size).toBe(0)
  })

  it("skips entries not found in originalEntries", () => {
    const linkedIds = new Set(["nonexistent"])
    const result = buildLinkedTestResultsMap(linkedIds, [])
    expect(result.size).toBe(0)
  })
})
