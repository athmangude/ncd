import { useState, useMemo, useCallback, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type {
  CareCompanionEvent,
  CareHistoryEntry,
  PaymentEvent,
  TestResultEvent,
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
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset,
      }
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/events`,
        { params }
      )
      return response.data as EventsResponse
    },
    staleTime: 2 * 60 * 1000,
  })

  // Fetch refill schedules
  const refillQuery = useRefillSchedule()

  // Fetch test schedules (no existing hook; inline query)
  const testScheduleQuery = useQuery({
    queryKey: [testScheduleQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/test-schedules`
      )
      return response.data as TestScheduleResponse
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
    const emptyResult = {
      monthGroups: [] as MonthGroup[],
      upcomingEvents: [] as CareHistoryEntry[],
      summary: {
        totalVisits: 0,
        facilitiesVisited: 0,
        dateRange: { from: "", to: "" },
        lastVisit: null,
      } as CareHistorySummary,
      linkedTestResults: new Map<string, TestResultEvent>(),
      cashbackMap: new Map<string, { amount: number; rate: number }>(),
    }

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

    // 9. Compute summary stats from the full (unfiltered) classified entries
    if (accumulatedEvents.length === 0) {
      return { ...emptyResult, linkedTestResults, cashbackMap }
    }

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
