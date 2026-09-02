import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
  AlertTriangle,
  Loader2,
  Pill,
  Building2,
  Calendar,
  ChevronDown,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { useMedicationTimeline } from "./hooks/useMedicationTimeline"
import { useCareCompanionStore } from "./store/careCompanionStore"
import type { TimelineEntry } from "@/types/care-companion"

const PAGE_SIZE = 20

function formatKES(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "KES 0"
  return `KES ${num.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  })
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function groupByMonth(
  entries: TimelineEntry[]
): { monthKey: string; label: string; entries: TimelineEntry[] }[] {
  const grouped = new Map<string, TimelineEntry[]>()

  for (const entry of entries) {
    const key = getMonthKey(entry.date)
    const existing = grouped.get(key)
    if (existing) {
      existing.push(entry)
    } else {
      grouped.set(key, [entry])
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthEntries]) => ({
      monthKey,
      label: formatMonthYear(monthEntries[0].date),
      entries: monthEntries.sort((a, b) => b.date.localeCompare(a.date)),
    }))
}

function entryKey(e: TimelineEntry): string {
  return `${e.date}|${e.medicationName}|${e.facilityName}`
}

/**
 * Synchronously accumulates timeline entries across paginated fetches.
 * Uses a ref to persist entries between renders without requiring an
 * effect, so the first render after data arrives already has entries.
 */
function useAccumulatedEntries(
  data: { entries: TimelineEntry[] } | undefined,
  offset: number,
  filterKey: string | null
) {
  const cacheRef = useRef<{
    filterKey: string | null
    entries: TimelineEntry[]
    seenKeys: Set<string>
    lastOffset: number
  }>({ filterKey: null, entries: [], seenKeys: new Set(), lastOffset: -1 })

  return useMemo(() => {
    const cache = cacheRef.current

    // Reset on filter change
    if (cache.filterKey !== filterKey) {
      cache.filterKey = filterKey
      cache.entries = []
      cache.seenKeys = new Set()
      cache.lastOffset = -1
    }

    if (!data || cache.lastOffset === offset) {
      return cache.entries
    }

    if (offset === 0) {
      cache.entries = data.entries
      cache.seenKeys = new Set(data.entries.map(entryKey))
    } else {
      const newEntries = data.entries.filter((e) => {
        const key = entryKey(e)
        return !cache.seenKeys.has(key)
      })
      for (const e of newEntries) {
        cache.seenKeys.add(entryKey(e))
      }
      cache.entries = [...cache.entries, ...newEntries]
    }

    cache.lastOffset = offset
    return cache.entries
  }, [data, offset, filterKey])
}

function SummaryHeader({
  totalMedications,
  pharmaciesUsed,
  dateRange,
}: {
  totalMedications: number
  pharmaciesUsed: number
  dateRange: { from: string; to: string }
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Purchase History
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {dateRange.from && dateRange.to
          ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
          : "No date range available"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Medications</p>
          <p className="text-lg font-semibold font-mono text-foreground">
            {totalMedications}
          </p>
        </div>
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Pharmacies</p>
          <p className="text-lg font-semibold font-mono text-foreground">
            {pharmaciesUsed}
          </p>
        </div>
      </div>
    </div>
  )
}

function MedicationFilterChips({
  medications,
  activeFilter,
  onFilterChange,
}: {
  medications: string[]
  activeFilter: string | null
  onFilterChange: (filter: string | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          activeFilter === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground active:bg-muted/80"
        )}
      >
        All
      </button>
      {medications.map((med) => (
        <button
          key={med}
          type="button"
          onClick={() => onFilterChange(med)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeFilter === med
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground active:bg-muted/80"
          )}
        >
          {med}
        </button>
      ))}
    </div>
  )
}

function TimelineEntryCard({ entry }: { entry: TimelineEntry }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3",
        entry.isGapAnomaly && "border-warning"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <Pill className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {entry.medicationName}
            </p>
            {entry.dosage && (
              <p className="text-xs text-muted-foreground">
                {entry.dosage}
                {entry.quantity != null ? ` x ${entry.quantity}` : ""}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate">
                {entry.facilityName}
              </p>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold font-mono text-foreground">
            {formatKES(entry.lineTotal)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDate(entry.date)}
          </p>
        </div>
      </div>

      {entry.isGapAnomaly && entry.gapDaysFromPrevious != null && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-warning px-2.5 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
          <p className="text-[11px] font-medium text-amber-800">
            {entry.gapDaysFromPrevious}-day gap since previous purchase
          </p>
        </div>
      )}
    </div>
  )
}

function MonthGroup({
  label,
  entries,
}: {
  label: string
  entries: TimelineEntry[]
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-1 pb-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {entries.map((entry, idx) => (
          <TimelineEntryCard
            key={`${entry.date}-${entry.medicationName}-${idx}`}
            entry={entry}
          />
        ))}
      </div>
    </div>
  )
}

export default function MedicationTimelinePage() {
  const [offset, setOffset] = useState(0)

  const { activeMedicationFilter, setActiveMedicationFilter } =
    useCareCompanionStore()

  const { data, isLoading, error, isFetching } = useMedicationTimeline({
    limit: PAGE_SIZE,
    offset,
    medicationId: activeMedicationFilter,
  })

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.VIEW)
  }, [])

  const allEntries = useAccumulatedEntries(data, offset, activeMedicationFilter)

  const handleFilterChange = useCallback(
    (filter: string | null) => {
      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.FILTER_CHANGE, {
        medication: filter ?? "all",
      })
      setActiveMedicationFilter(filter)
      setOffset(0)
    },
    [setActiveMedicationFilter]
  )

  const uniqueMedications = useMemo(() => {
    const names = new Set(allEntries.map((e) => e.medicationName))
    return Array.from(names).sort()
  }, [allEntries])

  const groupedEntries = useMemo(
    () => groupByMonth(allEntries),
    [allEntries]
  )

  const hasMore = useMemo(() => {
    if (!data?.pagination) return false
    return offset + PAGE_SIZE < data.pagination.total
  }, [data?.pagination, offset])

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + PAGE_SIZE)
  }, [])

  if (isLoading && offset === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load your medication history.
        </p>
      </div>
    )
  }

  if (!data && allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center px-4">
        <Pill className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No medication purchases recorded yet. Your purchase history will
          appear here as you use Jireh Pay at pharmacies.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {data?.summary && (
        <SummaryHeader
          totalMedications={data.summary.totalMedications}
          pharmaciesUsed={data.summary.pharmaciesUsed}
          dateRange={data.summary.dateRange}
        />
      )}

      {uniqueMedications.length > 1 && (
        <MedicationFilterChips
          medications={uniqueMedications}
          activeFilter={activeMedicationFilter}
          onFilterChange={handleFilterChange}
        />
      )}

      {groupedEntries.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Pill className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No purchases found for this medication.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {groupedEntries.map((group) => (
          <MonthGroup
            key={group.monthKey}
            label={group.label}
            entries={group.entries}
          />
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isFetching}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors",
            isFetching
              ? "opacity-50 cursor-not-allowed"
              : "active:bg-muted/50"
          )}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {isFetching ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  )
}
