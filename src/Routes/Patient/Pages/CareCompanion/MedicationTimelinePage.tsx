import { useEffect, useState, useCallback } from "react"
import {
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  Stethoscope,
  FlaskConical,
  Pill,
  Package,
  Upload,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import {
  useClinicalVisits,
  type ClinicalVisit,
  type LineItem,
  type TestResultData,
} from "./hooks/useClinicalVisits"

function formatKES(value: number): string {
  return `KES ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  })
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function groupVisitsByMonth(
  visits: ClinicalVisit[],
): { monthKey: string; label: string; visits: ClinicalVisit[] }[] {
  const grouped = new Map<string, ClinicalVisit[]>()
  for (const visit of visits) {
    const key = getMonthKey(visit.date)
    const existing = grouped.get(key)
    if (existing) existing.push(visit)
    else grouped.set(key, [visit])
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthVisits]) => ({
      monthKey,
      label: formatMonthYear(monthVisits[0].date),
      visits: monthVisits.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    }))
}

function facilityTypeLabel(type: string): string {
  switch (type) {
    case "HOSPITAL":
      return "Hospital"
    case "PHARMACY":
      return "Pharmacy"
    case "LAB":
      return "Laboratory"
    case "CLINIC":
      return "Clinic"
    default:
      return type
  }
}

function facilityTypeColor(type: string): string {
  switch (type) {
    case "HOSPITAL":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    case "PHARMACY":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    case "LAB":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    case "CLINIC":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function metricStatusColor(status: string): string {
  switch (status) {
    case "NORMAL":
      return "text-emerald-600 dark:text-emerald-400"
    case "LOW":
      return "text-amber-600 dark:text-amber-400"
    case "HIGH":
      return "text-amber-600 dark:text-amber-400"
    case "CRITICAL":
      return "text-red-600 dark:text-red-400"
    default:
      return "text-muted-foreground"
  }
}

function MetricStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "NORMAL":
      return <Minus className="h-3 w-3" />
    case "HIGH":
      return <TrendingUp className="h-3 w-3" />
    case "LOW":
      return <TrendingDown className="h-3 w-3" />
    case "CRITICAL":
      return <AlertTriangle className="h-3 w-3" />
    default:
      return null
  }
}

function SummaryHeader({
  totalVisits,
  facilitiesVisited,
  totalSpent,
  dateRange,
}: {
  totalVisits: number
  facilitiesVisited: number
  totalSpent: number
  dateRange: { from: string; to: string }
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Care History</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {dateRange.from && dateRange.to
          ? `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`
          : "No visits recorded yet"}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Visits</p>
          <p className="text-lg font-semibold font-mono text-foreground">
            {totalVisits}
          </p>
        </div>
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Facilities</p>
          <p className="text-lg font-semibold font-mono text-foreground">
            {facilitiesVisited}
          </p>
        </div>
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Total Spend</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            {formatKES(totalSpent)}
          </p>
        </div>
      </div>
    </div>
  )
}

function ComponentIcon({ category }: { category: string }) {
  switch (category) {
    case "CONSULTATION":
      return <Stethoscope className="h-3.5 w-3.5" />
    case "LAB_TEST":
      return <FlaskConical className="h-3.5 w-3.5" />
    case "MEDICATION":
      return <Pill className="h-3.5 w-3.5" />
    case "SUPPLY":
    case "SUPPLIES":
      return <Package className="h-3.5 w-3.5" />
    default:
      return <FileText className="h-3.5 w-3.5" />
  }
}

function categoryLabel(cat: string): string {
  switch (cat) {
    case "CONSULTATION":
      return "Consultation"
    case "LAB_TEST":
      return "Lab Test"
    case "MEDICATION":
      return "Prescription"
    case "SUPPLY":
    case "SUPPLIES":
      return "Supplies"
    default:
      return cat
  }
}

function LineItemRow({ item }: { item: LineItem }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-muted-foreground">
          <ComponentIcon category={item.category} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {item.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {categoryLabel(item.category)}
            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
          </p>
        </div>
      </div>
      <p className="shrink-0 text-xs font-mono text-muted-foreground">
        {formatKES(item.total)}
      </p>
    </div>
  )
}

function TestResultsCard({ results }: { results: TestResultData }) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-800/50 dark:bg-purple-950/20">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          {results.testName} Results
        </p>
      </div>
      <div className="space-y-1.5">
        {results.metrics.map((metric) => (
          <div
            key={metric.name}
            className="flex items-center justify-between gap-2"
          >
            <p className="text-xs text-foreground">{metric.name}</p>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-semibold font-mono",
                  metricStatusColor(metric.status),
                )}
              >
                {metric.value} {metric.unit}
              </span>
              <span className={metricStatusColor(metric.status)}>
                <MetricStatusIcon status={metric.status} />
              </span>
            </div>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground mt-1">
          Reference:{" "}
          {results.metrics.map((m) => `${m.name}: ${m.referenceRange}`).join(", ")}
        </p>
      </div>
    </div>
  )
}

function AiInsightCard({ insight }: { insight: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800/50 dark:bg-amber-950/20">
      <div className="flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
            AI Insight
          </p>
          <p className="text-xs text-foreground leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  )
}

function UploadLabResultsPrompt({ labNames }: { labNames: string[] }) {
  return (
    <button
      type="button"
      className="w-full rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3 transition-colors active:bg-primary/10"
      onClick={() => {
        trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.VIEW, {
          action: "upload_lab_results",
          labs: labNames,
        })
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-4 w-4 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-foreground">
            Upload lab results
          </p>
          <p className="text-[11px] text-muted-foreground">
            {labNames.join(", ")} — add your results to get AI insights
          </p>
        </div>
      </div>
    </button>
  )
}

function VisitCard({ visit }: { visit: ClinicalVisit }) {
  const [expanded, setExpanded] = useState(false)
  const hasComponents =
    visit.consultations.length > 0 ||
    visit.labs.length > 0 ||
    visit.prescriptions.length > 0 ||
    visit.supplies.length > 0

  const componentCounts = [
    visit.consultations.length > 0 && "Consultation",
    visit.labs.length > 0 &&
      `${visit.labs.length} lab${visit.labs.length > 1 ? "s" : ""}`,
    visit.prescriptions.length > 0 &&
      `${visit.prescriptions.length} med${visit.prescriptions.length > 1 ? "s" : ""}`,
    visit.supplies.length > 0 && "Supplies",
  ].filter(Boolean)

  const labNames = visit.labs.map((l) => l.name)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        className="w-full p-3 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {visit.facilityName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    facilityTypeColor(visit.facilityType),
                  )}
                >
                  {facilityTypeLabel(visit.facilityType)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(visit.date)}
                </span>
              </div>
              {componentCounts.length > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {componentCounts.join(" · ")}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <p className="text-sm font-semibold font-mono text-foreground">
              {formatKES(visit.totalAmount)}
            </p>
            {hasComponents &&
              (expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ))}
          </div>
        </div>
      </button>

      {expanded && hasComponents && (
        <div className="border-t px-3 pb-3 pt-2 space-y-3">
          {visit.consultations.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Consultation
              </p>
              {visit.consultations.map((item, i) => (
                <LineItemRow key={`c-${i}`} item={item} />
              ))}
            </div>
          )}

          {visit.labs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Lab Tests
              </p>
              {visit.labs.map((item, i) => (
                <LineItemRow key={`l-${i}`} item={item} />
              ))}
            </div>
          )}

          {visit.prescriptions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Prescriptions
              </p>
              {visit.prescriptions.map((item, i) => (
                <LineItemRow key={`p-${i}`} item={item} />
              ))}
            </div>
          )}

          {visit.supplies.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Supplies
              </p>
              {visit.supplies.map((item, i) => (
                <LineItemRow key={`s-${i}`} item={item} />
              ))}
            </div>
          )}

          {visit.fundingSources.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {visit.fundingSources.map((fs, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {fs.source.replace(/_/g, " ")} · {formatKES(fs.amount)}
                </span>
              ))}
              {visit.cashbackAmount > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  +{formatKES(visit.cashbackAmount)} cashback
                </span>
              )}
            </div>
          )}

          {visit.hasLabResults && visit.testResultEvent && (
            <TestResultsCard results={visit.testResultEvent} />
          )}

          {!visit.hasLabResults && visit.labs.length > 0 && (
            <UploadLabResultsPrompt labNames={labNames} />
          )}

          {visit.aiInsight && <AiInsightCard insight={visit.aiInsight} />}
        </div>
      )}
    </div>
  )
}

function MonthGroup({
  label,
  visits,
}: {
  label: string
  visits: ClinicalVisit[]
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-1 pb-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {visits.map((visit) => (
          <VisitCard key={visit.id} visit={visit} />
        ))}
      </div>
    </div>
  )
}

export default function MedicationTimelinePage() {
  const { visits, summary, isLoading, error } = useClinicalVisits()

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.VIEW)
  }, [])

  const [facilityFilter, setFacilityFilter] = useState<string | null>(null)

  const filteredVisits = facilityFilter
    ? visits.filter((v) => v.facilityName === facilityFilter)
    : visits

  const monthGroups = groupVisitsByMonth(filteredVisits)

  const uniqueFacilities = Array.from(
    new Set(visits.map((v) => v.facilityName)),
  ).sort()

  const handleFacilityFilter = useCallback((facility: string | null) => {
    setFacilityFilter(facility)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && visits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load your care history.
        </p>
      </div>
    )
  }

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center px-4">
        <Stethoscope className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No clinical visits recorded yet. Your care history will appear here as
          you visit facilities through Jireh.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <SummaryHeader
        totalVisits={summary.totalVisits}
        facilitiesVisited={summary.facilitiesVisited}
        totalSpent={summary.totalSpent}
        dateRange={summary.dateRange}
      />

      {uniqueFacilities.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => handleFacilityFilter(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              facilityFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground active:bg-muted/80",
            )}
          >
            All facilities
          </button>
          {uniqueFacilities.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleFacilityFilter(f)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                facilityFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground active:bg-muted/80",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {monthGroups.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No visits found for this facility.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {monthGroups.map((group) => (
          <MonthGroup
            key={group.monthKey}
            label={group.label}
            visits={group.visits}
          />
        ))}
      </div>
    </div>
  )
}
