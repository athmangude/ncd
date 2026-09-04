import { format, parseISO } from "date-fns"
import type {
  CareCompanionEvent,
  CareHistoryEntry,
  PaymentEvent,
  LlmActionEvent,
  TestResultEvent,
  DrugInteractionDetectedEvent,
  RefillScheduleChangeEvent,
  TestScheduleChangeEvent,
  RefillScheduleRemoveEvent,
  TestScheduleRemoveEvent,
} from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Event types excluded entirely from care history output. */
const EXCLUDED_EVENT_TYPES = new Set([
  "CASHBACK_EARNED",
  "LOAN_DISBURSED",
  "LOAN_REPAYMENT",
  "LOAN_OVERDUE",
  "CIRCLE_INVITE_SENT",
  "CIRCLE_INVITE_ACCEPTED",
  "CASHBACK_SHARED",
  "JIREH_PLUS_STATUS_CHANGE",
])

/** Schedule-related event types mapped to SCHEDULE_CHANGE card type. */
const SCHEDULE_CHANGE_TYPES = new Set([
  "REFILL_SCHEDULE_CHANGE",
  "TEST_SCHEDULE_CHANGE",
  "REFILL_SCHEDULE_REMOVE",
  "TEST_SCHEDULE_REMOVE",
])

/** Funding source type codes to human-readable labels. */
const FUNDING_SOURCE_LABELS: Record<string, string> = {
  WALLET: "Jireh Wallet",
  MPESA: "M-Pesa",
  CASHBACK: "Care Fund",
  LOAN: "Loan",
  CARE_SAVER: "Care Saver",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts YYYY-MM-DD date portion from an ISO timestamp. */
function toDateKey(timestamp: string): string {
  return timestamp.slice(0, 10)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Maps a funding source type code to a human-readable label.
 *
 * @example formatFundingSource("WALLET") // "Jireh Wallet"
 * @example formatFundingSource("MPESA")  // "M-Pesa"
 */
export function formatFundingSource(type: string): string {
  return FUNDING_SOURCE_LABELS[type] ?? type
}

/**
 * Splits payment line items into category buckets.
 *
 * @returns Object with consultation, labTest, prescription, and supply arrays
 */
export function categorizeLineItems(
  lineItems: PaymentEvent["lineItems"]
): {
  consultation: PaymentEvent["lineItems"]
  labTest: PaymentEvent["lineItems"]
  prescription: PaymentEvent["lineItems"]
  supply: PaymentEvent["lineItems"]
} {
  const consultation: PaymentEvent["lineItems"] = []
  const labTest: PaymentEvent["lineItems"] = []
  const prescription: PaymentEvent["lineItems"] = []
  const supply: PaymentEvent["lineItems"] = []

  for (const item of lineItems) {
    switch (item.category) {
      case "CONSULTATION":
        consultation.push(item)
        break
      case "LAB_TEST":
        labTest.push(item)
        break
      case "MEDICATION":
        prescription.push(item)
        break
      case "SUPPLY":
        supply.push(item)
        break
    }
  }

  return { consultation, labTest, prescription, supply }
}

/**
 * Classifies a flat array of CareCompanionEvent into CareHistoryEntry[].
 *
 * - Filters out excluded event types and INVOICE_POPULATE LLM actions.
 * - Groups PAYMENT events by date + facilityName into VISIT_GROUP entries.
 * - Maps remaining events to their respective timeline card types.
 * - Returns entries sorted by date descending.
 */
export function classifyEvents(
  events: CareCompanionEvent[]
): CareHistoryEntry[] {
  const entries: CareHistoryEntry[] = []
  const paymentGroups = new Map<string, PaymentEvent[]>()

  for (const event of events) {
    // Skip excluded event types
    if (EXCLUDED_EVENT_TYPES.has(event.type)) continue

    // Skip LLM_ACTION events with actionType INVOICE_POPULATE
    if (
      event.type === "LLM_ACTION" &&
      (event as LlmActionEvent).actionType === "INVOICE_POPULATE"
    ) {
      continue
    }

    switch (event.type) {
      case "PAYMENT": {
        const pe = event as PaymentEvent
        const groupKey = `${toDateKey(pe.timestamp)}|${pe.facilityName}`
        const existing = paymentGroups.get(groupKey)
        if (existing) {
          existing.push(pe)
        } else {
          paymentGroups.set(groupKey, [pe])
        }
        break
      }

      case "TEST_RESULT": {
        const te = event as TestResultEvent
        entries.push({
          id: te.id,
          type: "TEST_RESULT",
          date: toDateKey(te.timestamp),
          facilityName: null,
          facilityType: null,
          title: te.testName,
          sourceEvents: [te],
          totalCost: null,
          fundingSources: [],
        })
        break
      }

      case "LLM_ACTION": {
        const le = event as LlmActionEvent
        entries.push({
          id: le.id,
          type: "AI_INSIGHT",
          date: toDateKey(le.timestamp),
          facilityName: null,
          facilityType: null,
          title: le.title,
          sourceEvents: [le],
          totalCost: null,
          fundingSources: [],
        })
        break
      }

      case "DRUG_INTERACTION_DETECTED": {
        const de = event as DrugInteractionDetectedEvent
        entries.push({
          id: de.id,
          type: "DRUG_INTERACTION",
          date: toDateKey(de.timestamp),
          facilityName: null,
          facilityType: null,
          title: de.herbName
            ? `${de.medicationA} + ${de.herbName}`
            : `${de.medicationA} + ${de.medicationB}`,
          sourceEvents: [de],
          totalCost: null,
          fundingSources: [],
        })
        break
      }

      default: {
        if (SCHEDULE_CHANGE_TYPES.has(event.type)) {
          const se = event as
            | RefillScheduleChangeEvent
            | TestScheduleChangeEvent
            | RefillScheduleRemoveEvent
            | TestScheduleRemoveEvent

          const name =
            "medicationName" in se ? se.medicationName : se.testName
          entries.push({
            id: se.id,
            type: "SCHEDULE_CHANGE",
            date: toDateKey(se.timestamp),
            facilityName: null,
            facilityType: null,
            title: name,
            sourceEvents: [se],
            totalCost: null,
            fundingSources: [],
          })
        }
        break
      }
    }
  }

  // Build VISIT_GROUP entries from payment groups
  for (const [, groupEvents] of paymentGroups) {
    const first = groupEvents[0]
    const totalCost = groupEvents.reduce((sum, pe) => sum + pe.totalAmount, 0)

    const allSourceTypes = groupEvents.flatMap((pe) =>
      pe.fundingSources.map((fs) => fs.type)
    )
    const uniqueSources = [...new Set(allSourceTypes)]

    entries.push({
      id: first.id,
      type: "VISIT_GROUP",
      date: toDateKey(first.timestamp),
      facilityName: first.facilityName,
      facilityType: first.facilityType,
      title: first.facilityName,
      sourceEvents: groupEvents,
      totalCost,
      fundingSources: uniqueSources,
    })
  }

  // Sort all entries by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date))

  return entries
}

/**
 * Groups CareHistoryEntry[] by calendar month for timeline display.
 *
 * @returns Array of month groups sorted in reverse chronological order,
 *   with entries within each group sorted by date descending.
 */
export function groupByMonth(
  entries: CareHistoryEntry[]
): { monthKey: string; label: string; entries: CareHistoryEntry[] }[] {
  const grouped = new Map<string, CareHistoryEntry[]>()

  for (const entry of entries) {
    const monthKey = entry.date.slice(0, 7) // YYYY-MM
    const existing = grouped.get(monthKey)
    if (existing) {
      existing.push(entry)
    } else {
      grouped.set(monthKey, [entry])
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthEntries]) => ({
      monthKey,
      label: format(parseISO(`${monthKey}-01`), "MMMM yyyy"),
      entries: monthEntries.sort((a, b) => b.date.localeCompare(a.date)),
    }))
}
