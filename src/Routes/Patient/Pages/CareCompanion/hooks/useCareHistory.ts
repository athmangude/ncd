import { useState, useMemo, useCallback, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  CareCompanionEvent,
  CareHistoryEntry,
  PaymentEvent,
  TestScheduleItem,
  TimelineCardType,
} from "@/types/care-companion"
import { useCareCompanionStore } from "../store/careCompanionStore"
import { useRefillSchedule } from "./useRefillSchedule"
import { classifyEvents, groupByMonth } from "../utils/careHistoryClassifier"
import {
  linkTestResults,
  linkCashback,
  computeAdherenceGaps,
  generateUpcomingEvents,
  buildLinkedTestResultsMap,
} from "../utils/careHistoryEnricher"
import { COMPOSITE_FILTER_MAP } from "../components/care-history/CareHistoryFilters"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

export const careHistoryQueryKey = "careCompanionCareHistory"
const testScheduleQueryKey = "careCompanionTestSchedules"

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface EventsResponse {
  events: CareCompanionEvent[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

interface TestScheduleResponse {
  schedules: TestScheduleItem[]
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CareHistorySummary {
  totalVisits: number
  facilitiesVisited: number
  dateRange: { from: string; to: string }
  lastVisit: { date: string; facilityName: string } | null
}

export interface MonthGroup {
  monthKey: string
  label: string
  entries: CareHistoryEntry[]
}

// ---------------------------------------------------------------------------
// Accumulated events helper
// ---------------------------------------------------------------------------

/**
 * Synchronously accumulates care companion events across paginated fetches.
 * Adapted from MedicationTimelinePage's useAccumulatedEntries pattern.
 *
 * Uses a ref to persist events between renders so the first render after
 * data arrives already has the full accumulated set.
 *
 * The `dataUpdatedAt` parameter ensures that when a React Query refetch
 * delivers fresh server data for the current offset (e.g. after a new
 * PAYMENT event), the cache replaces the stale first page instead of
 * short-circuiting on `lastOffset === offset`.
 */
function useAccumulatedEvents(
  data: EventsResponse | undefined,
  offset: number,
  filterKey: string,
  dataUpdatedAt: number
) {
  const cacheRef = useRef<{
    filterKey: string
    events: CareCompanionEvent[]
    seenIds: Set<string>
    lastOffset: number
    lastDataUpdatedAt: number
  }>({
    filterKey: "",
    events: [],
    seenIds: new Set(),
    lastOffset: -1,
    lastDataUpdatedAt: 0,
  })

  return useMemo(() => {
    const cache = cacheRef.current

    // Reset on filter change
    if (cache.filterKey !== filterKey) {
      cache.filterKey = filterKey
      cache.events = []
      cache.seenIds = new Set()
      cache.lastOffset = -1
      cache.lastDataUpdatedAt = 0
    }

    if (!data) {
      return cache.events
    }

    // Skip if offset and data timestamp are unchanged
    if (
      cache.lastOffset === offset &&
      cache.lastDataUpdatedAt === dataUpdatedAt
    ) {
      return cache.events
    }

    if (offset === 0) {
      cache.events = data.events
      cache.seenIds = new Set(data.events.map((e) => e.id))
    } else {
      const newEvents = data.events.filter((e) => !cache.seenIds.has(e.id))
      for (const e of newEvents) {
        cache.seenIds.add(e.id)
      }
      cache.events = [...cache.events, ...newEvents]
    }

    cache.lastOffset = offset
    cache.lastDataUpdatedAt = dataUpdatedAt
    return cache.events
  }, [data, offset, filterKey, dataUpdatedAt])
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCareHistory() {
  // Store filters
  const activeEventTypeFilter = useCareCompanionStore(
    (s) => s.activeEventTypeFilter
  )
  const activeFacilityFilter = useCareCompanionStore(
    (s) => s.activeFacilityFilter
  )

  // Pagination state
  const [offset, setOffset] = useState(0)

  // Detect filter changes and reset offset synchronously during render.
  // This follows the React-recommended "adjusting state when a prop changes"
  // pattern to avoid an extra render cycle from useEffect.
  const filterKey = `${activeEventTypeFilter ?? ""}|${activeFacilityFilter ?? ""}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)

  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setOffset(0)
  }

  // Fetch events
  const eventsQuery = useQuery({
    queryKey: [
      careHistoryQueryKey,
      offset,
      activeEventTypeFilter ?? null,
      activeFacilityFilter ?? null,
    ],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("events")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      const events: CareCompanionEvent[] = (data ?? []).map((row: any) => ({
        id: row.id,
        type: row.type,
        timestamp: row.created_at,
        source: row.data?.source ?? "system",
        ...row.data,
      }))
      return {
        events,
        pagination: { total: count ?? 0, limit: PAGE_SIZE, offset },
      } as EventsResponse
    },
    staleTime: 2 * 60 * 1000,
  })

  // Fetch refill schedules
  const refillQuery = useRefillSchedule()

  // Fetch test schedules (no existing hook; inline query)
  const testScheduleQuery = useQuery({
    queryKey: [testScheduleQueryKey],
    queryFn: async () => {
      const DAY_MS = 86_400_000
      const now = new Date()
      const { data, error } = await supabase
        .from("test_schedules")
        .select("*")
        .order("next_date", { ascending: true })
      if (error) throw error
      const schedules: TestScheduleItem[] = (data ?? []).map((t: any) => {
        const days = Math.ceil(
          (new Date(t.next_date).getTime() - now.getTime()) / DAY_MS,
        )
        return {
          id: t.id,
          testName: t.test_name,
          expectedDate: t.next_date,
          status: days <= 0 ? "OVERDUE" : days <= 3 ? "DUE" : "UPCOMING",
          daysUntilTest: days,
          frequencyMonths: t.frequency_months,
        } as TestScheduleItem
      })
      return { schedules } as TestScheduleResponse
    },
    staleTime: 5 * 60 * 1000,
  })

  // Accumulate events across pages, resetting when filters change
  const accumulatedEvents = useAccumulatedEvents(
    eventsQuery.data,
    offset,
    filterKey,
    eventsQuery.dataUpdatedAt
  )

  // Determine whether more pages are available
  const hasMore = useMemo(() => {
    if (!eventsQuery.data?.pagination) return false
    return offset + PAGE_SIZE < eventsQuery.data.pagination.total
  }, [eventsQuery.data, offset])

  // Load next page
  const loadMore = useCallback(() => {
    if (hasMore) {
      setOffset((prev) => prev + PAGE_SIZE)
    }
  }, [hasMore])

  // Process accumulated events through classifier and enricher pipeline
  const processedData = useMemo(() => {
    // 1. Classify events into CareHistoryEntry[]
    const classifiedEntries = classifyEvents(accumulatedEvents)

    // 2. Link test results to visit groups within a 14-day window
    const { entries: entriesAfterTestLink, linkedTestIds } = linkTestResults(
      classifiedEntries,
      accumulatedEvents
    )

    // 3. Build linked test results map for VisitGroupCard
    const linkedTestResults = buildLinkedTestResultsMap(
      linkedTestIds,
      classifiedEntries
    )

    // 4. Build cashback map from raw events
    const cashbackMap = linkCashback(accumulatedEvents)

    // 5. Apply client-side filters (UPCOMING entries are never filtered out)
    let filteredEntries = entriesAfterTestLink

    if (activeEventTypeFilter) {
      const compositeTypes = COMPOSITE_FILTER_MAP[activeEventTypeFilter]
      filteredEntries = filteredEntries.filter((e) =>
        compositeTypes
          ? compositeTypes.includes(e.type as TimelineCardType) ||
            e.type === "UPCOMING"
          : e.type === activeEventTypeFilter || e.type === "UPCOMING"
      )
    }

    if (activeFacilityFilter) {
      filteredEntries = filteredEntries.filter(
        (e) => e.facilityName === null || e.facilityName === activeFacilityFilter
      )
    }

    // 6. Compute adherence gaps and upcoming events from schedules
    const refillSchedules = refillQuery.data?.schedules ?? []
    const testSchedules = testScheduleQuery.data?.schedules ?? []

    const paymentEvents = accumulatedEvents.filter(
      (e): e is PaymentEvent => e.type === "PAYMENT"
    )

    const adherenceGaps = computeAdherenceGaps(refillSchedules, paymentEvents)
    const upcomingEvents = generateUpcomingEvents(
      refillSchedules,
      testSchedules
    )

    // 7. Merge adherence gaps into timeline entries
    const allEntries = [...filteredEntries, ...adherenceGaps]

    // 8. Group by month for timeline display
    const monthGroups = groupByMonth(allEntries)

    // 9. Compute summary stats from the full (unfiltered) classified entries.
    // Note: monthGroups and upcomingEvents above are derived from schedule
    // data (adherence gaps, upcoming refills/tests) independently of whether
    // any companion events have loaded yet, so they must always be returned
    // -- even for a patient with no payment/event history yet -- rather than
    // being discarded when accumulatedEvents is empty.
    const visitGroupEntries = classifiedEntries.filter(
      (e) => e.type === "VISIT_GROUP"
    )

    const uniqueVisitKeys = new Set(
      visitGroupEntries.map((e) => `${e.date}|${e.facilityName}`)
    )
    const totalVisits = uniqueVisitKeys.size

    const uniqueFacilities = new Set(
      visitGroupEntries
        .map((e) => e.facilityName)
        .filter((n): n is string => n !== null)
    )
    const facilitiesVisited = uniqueFacilities.size

    const allDates = classifiedEntries.map((e) => e.date).sort()
    const dateRange = {
      from: allDates[0] ?? "",
      to: allDates[allDates.length - 1] ?? "",
    }

    const sortedVisits = [...visitGroupEntries].sort((a, b) =>
      b.date.localeCompare(a.date)
    )
    const lastVisit = sortedVisits[0]
      ? {
          date: sortedVisits[0].date,
          facilityName: sortedVisits[0].facilityName ?? "",
        }
      : null

    const summary: CareHistorySummary = {
      totalVisits,
      facilitiesVisited,
      dateRange,
      lastVisit,
    }

    return {
      monthGroups,
      upcomingEvents,
      summary,
      linkedTestResults,
      cashbackMap,
    }
  }, [
    accumulatedEvents,
    activeEventTypeFilter,
    activeFacilityFilter,
    refillQuery.data,
    testScheduleQuery.data,
  ])

  return {
    monthGroups: processedData.monthGroups,
    upcomingEvents: processedData.upcomingEvents,
    summary: processedData.summary,
    linkedTestResults: processedData.linkedTestResults,
    cashbackMap: processedData.cashbackMap,
    isLoading:
      eventsQuery.isLoading ||
      refillQuery.isLoading ||
      testScheduleQuery.isLoading,
    error: eventsQuery.error ?? refillQuery.error ?? testScheduleQuery.error,
    isFetching:
      eventsQuery.isFetching ||
      refillQuery.isFetching ||
      testScheduleQuery.isFetching,
    hasMore,
    loadMore,
  }
}
