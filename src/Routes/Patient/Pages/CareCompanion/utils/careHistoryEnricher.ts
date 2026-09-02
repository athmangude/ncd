// ---------------------------------------------------------------------------
// Care History Enricher
//
// Pure functions that transform classified CareHistoryEntry[] into a complete
// timeline with linked test results, cashback metadata, adherence gaps, and
// forward-looking schedule entries.
//
// Each function is independently unit-testable and free of side effects.
// ---------------------------------------------------------------------------

import { differenceInDays, parseISO } from "date-fns"
import type {
  CareCompanionEvent,
  CareHistoryEntry,
  CashbackEarnedEvent,
  PaymentEvent,
  RefillScheduleItem,
  TestResultEvent,
  TestScheduleItem,
} from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Helper interface for adherence gap data
// ---------------------------------------------------------------------------

export interface AdherenceGapData {
  medicationName: string
  daysOverdue: number
  // Not encoded in the pipe-delimited title (see parseAdherenceGapTitle);
  // only populated when the caller derives it separately, e.g. from
  // entry.id (`gap-{scheduleId}`).
  scheduleId?: string
}

// ---------------------------------------------------------------------------
// 1. linkTestResults
// ---------------------------------------------------------------------------

/**
 * Links TEST_RESULT entries to VISIT_GROUP entries containing a matching
 * LAB_TEST line item within a 14-day window.
 *
 * Linked test results are removed from the returned entries array (they will
 * be rendered inline on the visit card instead of standalone). The set of
 * linked test result ids is returned for the UI to consume.
 */
export function linkTestResults(
  entries: CareHistoryEntry[],
  _allEvents: CareCompanionEvent[]
): { entries: CareHistoryEntry[]; linkedTestIds: Set<string> } {
  const linkedTestIds = new Set<string>()

  const testResultEntries = entries.filter((e) => e.type === "TEST_RESULT")
  const visitGroupEntries = entries.filter((e) => e.type === "VISIT_GROUP")

  for (const testEntry of testResultEntries) {
    // Each TEST_RESULT entry should have exactly one TestResultEvent in sourceEvents
    const testEvent = testEntry.sourceEvents.find(
      (se) => se.type === "TEST_RESULT"
    )
    if (!testEvent || testEvent.type !== "TEST_RESULT") continue

    const testTimestamp = parseISO(testEvent.timestamp)
    const testName = testEvent.testName

    let matched = false

    for (const visitEntry of visitGroupEntries) {
      // Check each PAYMENT source event in this visit group
      const paymentEvents = visitEntry.sourceEvents.filter(
        (se): se is PaymentEvent => se.type === "PAYMENT"
      )

      for (const payment of paymentEvents) {
        // Check if the payment has a LAB_TEST line item matching the test name
        const hasMatchingLabTest = payment.lineItems.some(
          (li) =>
            li.category === "LAB_TEST" &&
            li.name.toLowerCase() === testName.toLowerCase()
        )

        if (!hasMatchingLabTest) continue

        // Check the 14-day window: test result must be on or after the
        // payment timestamp and within 14 calendar days
        const paymentTimestamp = parseISO(payment.timestamp)

        // Test result must not precede the payment
        if (testTimestamp < paymentTimestamp) continue

        const daysDiff = differenceInDays(testTimestamp, paymentTimestamp)

        if (daysDiff <= 14) {
          matched = true
          break
        }
      }

      if (matched) break
    }

    if (matched) {
      linkedTestIds.add(testEntry.id)
    }
  }

  const filteredEntries = entries.filter((e) => !linkedTestIds.has(e.id))

  return { entries: filteredEntries, linkedTestIds }
}

// ---------------------------------------------------------------------------
// 2. linkCashback
// ---------------------------------------------------------------------------

/**
 * Builds a map from paymentEventId to cashback amount/rate for the
 * VisitGroupCard to display alongside payment details.
 */
export function linkCashback(
  allEvents: CareCompanionEvent[]
): Map<string, { amount: number; rate: number }> {
  const cashbackMap = new Map<string, { amount: number; rate: number }>()

  const cashbackEvents = allEvents.filter(
    (e): e is CashbackEarnedEvent => e.type === "CASHBACK_EARNED"
  )

  for (const cb of cashbackEvents) {
    cashbackMap.set(cb.paymentEventId, {
      amount: cb.amount,
      rate: cb.rate,
    })
  }

  return cashbackMap
}

// ---------------------------------------------------------------------------
// 3. computeAdherenceGaps
// ---------------------------------------------------------------------------

/**
 * Generates ADHERENCE_GAP CareHistoryEntry items for overdue refill schedule
 * items. Each overdue medication gets one gap entry in the timeline.
 *
 * If a medication has been purchased (a PAYMENT event with a matching
 * medication line-item name, case-insensitive) on or after its expected refill
 * date, no adherence gap is generated -- the caregiver has already refilled.
 *
 * The gap entry encodes medicationName and daysOverdue in the title field
 * using a pipe-delimited format for the AdherenceGapCard to parse.
 */
export function computeAdherenceGaps(
  refillSchedules: RefillScheduleItem[],
  paymentEvents: PaymentEvent[]
): CareHistoryEntry[] {
  return refillSchedules
    .filter((s) => {
      if (s.status !== "OVERDUE" || s.daysUntilRefill >= 0) return false

      // Suppress gap if a payment with a matching medication line item
      // occurred on or after the expected refill date
      const refillDate = parseISO(s.expectedRefillDate)
      const alreadyRefilled = paymentEvents.some((pe) => {
        const paymentDate = parseISO(pe.timestamp)
        if (paymentDate < refillDate) return false
        return pe.lineItems.some(
          (li) => li.name.toLowerCase() === s.medicationName.toLowerCase()
        )
      })

      return !alreadyRefilled
    })
    .map((schedule) => {
      const daysOverdue = Math.abs(schedule.daysUntilRefill)

      return {
        id: `gap-${schedule.id}`,
        type: "ADHERENCE_GAP" as const,
        date: schedule.expectedRefillDate,
        facilityName: null,
        facilityType: null,
        title: `${schedule.medicationName}|${daysOverdue}`,
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      }
    })
}

// ---------------------------------------------------------------------------
// 4. generateUpcomingEvents
// ---------------------------------------------------------------------------

/**
 * Generates UPCOMING CareHistoryEntry items for future-dated refill and test
 * schedules. Only includes schedules with future dates (daysUntilRefill > 0
 * for refills, daysUntilTest > 0 for tests) and non-cancelled status.
 *
 * Results are sorted ascending by date (nearest upcoming first).
 */
export function generateUpcomingEvents(
  refillSchedules: RefillScheduleItem[],
  testSchedules: TestScheduleItem[]
): CareHistoryEntry[] {
  const upcomingEntries: CareHistoryEntry[] = []

  for (const schedule of refillSchedules) {
    if (schedule.daysUntilRefill > 0 && schedule.status !== "CANCELLED") {
      upcomingEntries.push({
        id: `upcoming-refill-${schedule.id}`,
        type: "UPCOMING",
        date: schedule.expectedRefillDate,
        facilityName: null,
        facilityType: null,
        title: `${schedule.medicationName} refill due`,
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      })
    }
  }

  for (const schedule of testSchedules) {
    if (schedule.daysUntilTest > 0 && schedule.status !== "CANCELLED") {
      upcomingEntries.push({
        id: `upcoming-test-${schedule.id}`,
        type: "UPCOMING",
        date: schedule.expectedDate,
        facilityName: null,
        facilityType: null,
        title: `${schedule.testName} due`,
        sourceEvents: [],
        totalCost: null,
        fundingSources: [],
      })
    }
  }

  upcomingEntries.sort((a, b) => a.date.localeCompare(b.date))

  return upcomingEntries
}

// ---------------------------------------------------------------------------
// Helper: parseAdherenceGapTitle
// ---------------------------------------------------------------------------

/**
 * Parses the pipe-delimited title of an ADHERENCE_GAP entry into structured
 * data for the AdherenceGapCard component.
 */
export function parseAdherenceGapTitle(title: string): AdherenceGapData | null {
  const parts = title.split("|")
  if (parts.length !== 2) return null

  const daysOverdue = Number(parts[1])
  if (Number.isNaN(daysOverdue)) return null

  return {
    medicationName: parts[0],
    daysOverdue,
  }
}

// ---------------------------------------------------------------------------
// Helper: buildLinkedTestResultsMap
// ---------------------------------------------------------------------------

/**
 * Resolves linked test result entry ids (from linkTestResults) into the
 * `Map<string, TestResultEvent>` keyed by lowercase test name that
 * VisitGroupCard expects.
 *
 * This bridges the `Set<string>` output of linkTestResults with the
 * downstream card component's prop shape. Pass the *original* entries array
 * (before linkTestResults filtered them) so this function can look up each
 * entry's sourceEvents by id.
 */
export function buildLinkedTestResultsMap(
  linkedTestIds: Set<string>,
  originalEntries: CareHistoryEntry[]
): Map<string, TestResultEvent> {
  const map = new Map<string, TestResultEvent>()

  for (const entryId of linkedTestIds) {
    const entry = originalEntries.find((e) => e.id === entryId)
    if (!entry) continue

    const testEvent = entry.sourceEvents.find(
      (se): se is TestResultEvent => se.type === "TEST_RESULT"
    )
    if (testEvent) {
      map.set(testEvent.testName.toLowerCase(), testEvent)
    }
  }

  return map
}
