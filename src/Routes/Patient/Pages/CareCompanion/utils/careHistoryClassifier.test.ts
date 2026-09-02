import { describe, it, expect } from "vitest"
import type {
  CareCompanionEvent,
  PaymentEvent,
  TestResultEvent,
  LlmActionEvent,
  DrugInteractionDetectedEvent,
  RefillScheduleChangeEvent,
  TestScheduleChangeEvent,
  RefillScheduleRemoveEvent,
  CashbackEarnedEvent,
  CareHistoryEntry,
} from "@/types/care-companion"
import {
  classifyEvents,
  groupByMonth,
  formatFundingSource,
  categorizeLineItems,
} from "./careHistoryClassifier"

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makePayment(overrides: Partial<PaymentEvent> = {}): PaymentEvent {
  return {
    id: "pay-1",
    type: "PAYMENT",
    timestamp: "2025-06-15T10:00:00Z",
    source: "user",
    facilityName: "Nairobi Hospital",
    facilityType: "HOSPITAL",
    totalAmount: 2500,
    currency: "KES",
    lineItems: [
      {
        name: "Metformin",
        category: "MEDICATION",
        quantity: 1,
        unitPrice: 2500,
        lineTotal: 2500,
      },
    ],
    fundingSources: [{ type: "WALLET", amount: 2500 }],
    isInNetwork: true,
    ...overrides,
  }
}

function makeTestResult(
  overrides: Partial<TestResultEvent> = {}
): TestResultEvent {
  return {
    id: "tr-1",
    type: "TEST_RESULT",
    timestamp: "2025-06-16T09:00:00Z",
    source: "user",
    testName: "HbA1c",
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
    ...overrides,
  }
}

function makeLlmAction(
  overrides: Partial<LlmActionEvent> = {}
): LlmActionEvent {
  return {
    id: "llm-1",
    type: "LLM_ACTION",
    timestamp: "2025-06-17T12:00:00Z",
    source: "llm",
    actionType: "REFILL_NUDGE",
    title: "Time to refill",
    body: "Your Metformin is running low",
    severity: "INFO",
    relatedMedication: "Metformin",
    relatedScheduleId: null,
    inputHash: "abc",
    dismissed: false,
    ...overrides,
  }
}

function makeDrugInteraction(
  overrides: Partial<DrugInteractionDetectedEvent> = {}
): DrugInteractionDetectedEvent {
  return {
    id: "di-1",
    type: "DRUG_INTERACTION_DETECTED",
    timestamp: "2025-06-18T08:00:00Z",
    source: "system",
    medicationA: "Metformin",
    medicationB: "Glimepiride",
    herbName: null,
    severity: "MODERATE",
    clinicalEffect: "Hypoglycemia risk",
    recommendation: "Monitor blood sugar",
    ...overrides,
  }
}

function makeRefillScheduleChange(
  overrides: Partial<RefillScheduleChangeEvent> = {}
): RefillScheduleChangeEvent {
  return {
    id: "rsc-1",
    type: "REFILL_SCHEDULE_CHANGE",
    timestamp: "2025-06-19T07:00:00Z",
    source: "user",
    scheduleId: "sched-1",
    medicationName: "Metformin",
    conditions: ["DIABETES"],
    statusAtChange: "UPCOMING",
    daysUntilRefillAtChange: 5,
    previousFrequencyDays: 30,
    newFrequencyDays: 28,
    previousNextDate: "2025-06-24",
    newNextDate: "2025-06-22",
    reason: "Doctor recommendation",
    reasonCategory: "MEDICAL",
    estimatedCostPerRefill: 1200,
    ...overrides,
  }
}

function makeTestScheduleChange(
  overrides: Partial<TestScheduleChangeEvent> = {}
): TestScheduleChangeEvent {
  return {
    id: "tsc-1",
    type: "TEST_SCHEDULE_CHANGE",
    timestamp: "2025-06-20T14:00:00Z",
    source: "provider",
    scheduleId: "tsched-1",
    testName: "HbA1c",
    conditions: ["DIABETES"],
    statusAtChange: "UPCOMING",
    daysUntilTestAtChange: 10,
    previousFrequencyMonths: 6,
    newFrequencyMonths: 3,
    previousNextDate: "2025-12-01",
    newNextDate: "2025-09-01",
    reason: "Closer monitoring needed",
    reasonCategory: "MEDICAL",
    estimatedCostPerTest: 3500,
    ...overrides,
  }
}

function makeCashbackEarned(
  overrides: Partial<CashbackEarnedEvent> = {}
): CashbackEarnedEvent {
  return {
    id: "cb-1",
    type: "CASHBACK_EARNED",
    timestamp: "2025-06-15T10:01:00Z",
    source: "system",
    paymentEventId: "pay-1",
    amount: 125,
    currency: "KES",
    rate: 0.05,
    newBalance: 500,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// classifyEvents
// ---------------------------------------------------------------------------

describe("classifyEvents", () => {
  it("returns an empty array for empty input", () => {
    expect(classifyEvents([])).toEqual([])
  })

  it("excludes CASHBACK_EARNED events", () => {
    const events: CareCompanionEvent[] = [makeCashbackEarned()]
    const result = classifyEvents(events)
    expect(result).toHaveLength(0)
  })

  it("excludes LLM_ACTION events with actionType INVOICE_POPULATE", () => {
    const events: CareCompanionEvent[] = [
      makeLlmAction({ actionType: "INVOICE_POPULATE" }),
    ]
    const result = classifyEvents(events)
    expect(result).toHaveLength(0)
  })

  it("keeps non-INVOICE_POPULATE LLM_ACTION events as AI_INSIGHT", () => {
    const events: CareCompanionEvent[] = [makeLlmAction()]
    const result = classifyEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("AI_INSIGHT")
    expect(result[0].title).toBe("Time to refill")
  })

  it("groups PAYMENT events by date+facility into VISIT_GROUP", () => {
    const events: CareCompanionEvent[] = [
      makePayment({ id: "pay-1" }),
      makePayment({
        id: "pay-2",
        totalAmount: 1000,
        lineItems: [
          {
            name: "Amlodipine",
            category: "MEDICATION",
            quantity: 1,
            unitPrice: 1000,
            lineTotal: 1000,
          },
        ],
      }),
    ]
    const result = classifyEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("VISIT_GROUP")
    expect(result[0].totalCost).toBe(3500)
    expect(result[0].sourceEvents).toHaveLength(2)
  })

  it("creates separate VISIT_GROUPs for different facilities on the same day", () => {
    const events: CareCompanionEvent[] = [
      makePayment({ id: "pay-1", facilityName: "Hospital A" }),
      makePayment({ id: "pay-2", facilityName: "Hospital B" }),
    ]
    const result = classifyEvents(events)
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.type === "VISIT_GROUP")).toBe(true)
  })

  it("creates separate VISIT_GROUPs for same facility on different days", () => {
    const events: CareCompanionEvent[] = [
      makePayment({ id: "pay-1", timestamp: "2025-06-15T10:00:00Z" }),
      makePayment({ id: "pay-2", timestamp: "2025-06-16T10:00:00Z" }),
    ]
    const result = classifyEvents(events)
    expect(result).toHaveLength(2)
  })

  it("maps TEST_RESULT events correctly", () => {
    const events: CareCompanionEvent[] = [makeTestResult()]
    const result = classifyEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("TEST_RESULT")
    expect(result[0].title).toBe("HbA1c")
    expect(result[0].facilityName).toBeNull()
  })

  it("maps DRUG_INTERACTION_DETECTED with drug pair title", () => {
    const events: CareCompanionEvent[] = [makeDrugInteraction()]
    const result = classifyEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("DRUG_INTERACTION")
    expect(result[0].title).toBe("Metformin + Glimepiride")
  })

  it("maps DRUG_INTERACTION_DETECTED with herb name title", () => {
    const events: CareCompanionEvent[] = [
      makeDrugInteraction({
        medicationB: null,
        herbName: "St Johns Wort",
      }),
    ]
    const result = classifyEvents(events)
    expect(result[0].title).toBe("Metformin + St Johns Wort")
  })

  it("maps REFILL_SCHEDULE_CHANGE to SCHEDULE_CHANGE", () => {
    const events: CareCompanionEvent[] = [makeRefillScheduleChange()]
    const result = classifyEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("SCHEDULE_CHANGE")
    expect(result[0].title).toBe("Metformin")
  })

  it("maps TEST_SCHEDULE_CHANGE to SCHEDULE_CHANGE with testName", () => {
    const events: CareCompanionEvent[] = [makeTestScheduleChange()]
    const result = classifyEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("SCHEDULE_CHANGE")
    expect(result[0].title).toBe("HbA1c")
  })

  it("maps REFILL_SCHEDULE_REMOVE to SCHEDULE_CHANGE", () => {
    const event: RefillScheduleRemoveEvent = {
      id: "rsr-1",
      type: "REFILL_SCHEDULE_REMOVE",
      timestamp: "2025-06-19T07:00:00Z",
      source: "user",
      scheduleId: "sched-1",
      medicationName: "Metformin",
      conditions: ["DIABETES"],
      statusAtChange: "UPCOMING",
      daysUntilRefillAtChange: 5,
      reason: "Stopped by doctor",
      reasonCategory: "MEDICAL",
      estimatedCostPerRefill: 1200,
    }
    const result = classifyEvents([event])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("SCHEDULE_CHANGE")
  })

  it("sorts entries by date descending", () => {
    const events: CareCompanionEvent[] = [
      makePayment({ id: "pay-1", timestamp: "2025-06-10T10:00:00Z" }),
      makeTestResult({ id: "tr-1", timestamp: "2025-06-20T10:00:00Z" }),
      makeLlmAction({ id: "llm-1", timestamp: "2025-06-15T10:00:00Z" }),
    ]
    const result = classifyEvents(events)
    const dates = result.map((e) => e.date)
    expect(dates).toEqual(["2025-06-20", "2025-06-15", "2025-06-10"])
  })

  it("collects unique funding sources across grouped payments", () => {
    const events: CareCompanionEvent[] = [
      makePayment({
        id: "pay-1",
        fundingSources: [{ type: "WALLET", amount: 1000 }],
      }),
      makePayment({
        id: "pay-2",
        fundingSources: [
          { type: "WALLET", amount: 500 },
          { type: "MPESA", amount: 1000 },
        ],
      }),
    ]
    const result = classifyEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].fundingSources).toContain("WALLET")
    expect(result[0].fundingSources).toContain("MPESA")
    // Unique sources only
    expect(
      result[0].fundingSources.filter((s) => s === "WALLET")
    ).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// groupByMonth
// ---------------------------------------------------------------------------

describe("groupByMonth", () => {
  it("returns an empty array for empty input", () => {
    expect(groupByMonth([])).toEqual([])
  })

  it("groups entries by YYYY-MM", () => {
    const entries: CareHistoryEntry[] = [
      {
        id: "a",
        type: "VISIT_GROUP",
        date: "2025-06-15",
        facilityName: "A",
        facilityType: null,
        title: "A",
        sourceEvents: [],
        totalCost: 100,
        fundingSources: [],
      },
      {
        id: "b",
        type: "TEST_RESULT",
        date: "2025-06-20",
        facilityName: null,
        facilityType: null,
        title: "B",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
      {
        id: "c",
        type: "AI_INSIGHT",
        date: "2025-05-10",
        facilityName: null,
        facilityType: null,
        title: "C",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
    ]

    const groups = groupByMonth(entries)
    expect(groups).toHaveLength(2)
    // Reverse chronological
    expect(groups[0].monthKey).toBe("2025-06")
    expect(groups[0].entries).toHaveLength(2)
    expect(groups[1].monthKey).toBe("2025-05")
    expect(groups[1].entries).toHaveLength(1)
  })

  it("sorts month groups in reverse chronological order", () => {
    const entries: CareHistoryEntry[] = [
      {
        id: "a",
        type: "VISIT_GROUP",
        date: "2025-03-01",
        facilityName: null,
        facilityType: null,
        title: "A",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
      {
        id: "b",
        type: "VISIT_GROUP",
        date: "2025-08-01",
        facilityName: null,
        facilityType: null,
        title: "B",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
      {
        id: "c",
        type: "VISIT_GROUP",
        date: "2025-01-01",
        facilityName: null,
        facilityType: null,
        title: "C",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
    ]

    const groups = groupByMonth(entries)
    const keys = groups.map((g) => g.monthKey)
    expect(keys).toEqual(["2025-08", "2025-03", "2025-01"])
  })

  it("sorts entries within each group by date descending", () => {
    const entries: CareHistoryEntry[] = [
      {
        id: "a",
        type: "VISIT_GROUP",
        date: "2025-06-05",
        facilityName: null,
        facilityType: null,
        title: "A",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
      {
        id: "b",
        type: "VISIT_GROUP",
        date: "2025-06-25",
        facilityName: null,
        facilityType: null,
        title: "B",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
      {
        id: "c",
        type: "VISIT_GROUP",
        date: "2025-06-15",
        facilityName: null,
        facilityType: null,
        title: "C",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
    ]

    const groups = groupByMonth(entries)
    const dates = groups[0].entries.map((e) => e.date)
    expect(dates).toEqual(["2025-06-25", "2025-06-15", "2025-06-05"])
  })

  it("generates a human-readable label for each month", () => {
    const entries: CareHistoryEntry[] = [
      {
        id: "a",
        type: "VISIT_GROUP",
        date: "2025-01-15",
        facilityName: null,
        facilityType: null,
        title: "A",
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      },
    ]

    const groups = groupByMonth(entries)
    expect(groups[0].label).toBe("January 2025")
  })
})

// ---------------------------------------------------------------------------
// formatFundingSource
// ---------------------------------------------------------------------------

describe("formatFundingSource", () => {
  it("maps WALLET to Jireh Wallet", () => {
    expect(formatFundingSource("WALLET")).toBe("Jireh Wallet")
  })

  it("maps MPESA to M-Pesa", () => {
    expect(formatFundingSource("MPESA")).toBe("M-Pesa")
  })

  it("maps CASHBACK to Care Fund", () => {
    expect(formatFundingSource("CASHBACK")).toBe("Care Fund")
  })

  it("maps LOAN to Loan", () => {
    expect(formatFundingSource("LOAN")).toBe("Loan")
  })

  it("maps CARE_SAVER to Care Saver", () => {
    expect(formatFundingSource("CARE_SAVER")).toBe("Care Saver")
  })

  it("returns the raw code for unknown types", () => {
    expect(formatFundingSource("UNKNOWN")).toBe("UNKNOWN")
  })
})

// ---------------------------------------------------------------------------
// categorizeLineItems
// ---------------------------------------------------------------------------

describe("categorizeLineItems", () => {
  it("splits line items into category buckets", () => {
    const items: PaymentEvent["lineItems"] = [
      {
        name: "Metformin",
        category: "MEDICATION",
        quantity: 1,
        unitPrice: 1200,
        lineTotal: 1200,
      },
      {
        name: "HbA1c",
        category: "LAB_TEST",
        quantity: 1,
        unitPrice: 3500,
        lineTotal: 3500,
      },
      {
        name: "Follow-up",
        category: "CONSULTATION",
        quantity: 1,
        unitPrice: 500,
        lineTotal: 500,
      },
      {
        name: "Syringe",
        category: "SUPPLY",
        quantity: 2,
        unitPrice: 50,
        lineTotal: 100,
      },
    ]

    const result = categorizeLineItems(items)
    expect(result.prescription).toHaveLength(1)
    expect(result.labTest).toHaveLength(1)
    expect(result.consultation).toHaveLength(1)
    expect(result.supply).toHaveLength(1)
  })

  it("returns empty arrays when no items match", () => {
    const result = categorizeLineItems([])
    expect(result.consultation).toEqual([])
    expect(result.labTest).toEqual([])
    expect(result.prescription).toEqual([])
    expect(result.supply).toEqual([])
  })
})
