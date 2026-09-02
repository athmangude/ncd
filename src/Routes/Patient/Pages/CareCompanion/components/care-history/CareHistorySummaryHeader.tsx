import { cn } from "@/lib/utils"

export interface CareHistorySummary {
  totalVisits: number
  facilitiesVisited: number
  dateRange: { from: string; to: string }
  lastVisit: { date: string; facilityName: string } | null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function CareHistorySummaryHeader({
  summary,
}: {
  summary: CareHistorySummary
}) {
  const dateRangeText =
    summary.dateRange.from && summary.dateRange.to
      ? summary.dateRange.from === summary.dateRange.to
        ? formatDate(summary.dateRange.from)
        : `${formatDate(summary.dateRange.from)} - ${formatDate(summary.dateRange.to)}`
      : "No date range available"

  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">Care History</h2>
      <p className="mt-1 text-xs text-muted-foreground">{dateRangeText}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Facility visits</p>
          <p
            className={cn(
              "text-lg font-semibold font-mono text-foreground",
            )}
          >
            {summary.totalVisits}
          </p>
        </div>
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Facilities</p>
          <p
            className={cn(
              "text-lg font-semibold font-mono text-foreground",
            )}
          >
            {summary.facilitiesVisited}
          </p>
        </div>
      </div>
      {summary.lastVisit && (
        <p className="mt-3 text-xs text-muted-foreground">
          Last visit: {formatDate(summary.lastVisit.date)} at{" "}
          {summary.lastVisit.facilityName}
        </p>
      )}
    </div>
  )
}
