import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ClipboardList,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/analytics/tracking"
import { EVENTS } from "@/analytics/events"
import { useIntakeProfile } from "./hooks/useIntakeProfile"
import type {
  CareCompanionEvent,
  TestResultEvent,
  TestResultMetric,
  TestScheduleItem,
} from "@/types/care-companion"
import {
  generateSimulatedTestResults,
  generateTestResultInsights,
} from "@/lib/ai-pipeline"

type SimulationStatus = "idle" | "generating-results" | "generating-insights" | "done" | "error"

const EVENTS_QUERY_KEY = ["care-companion", "events"]

async function fetchEvents(): Promise<CareCompanionEvent[]> {
  const res = await fetch("/companion/events?limit=200")
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? json
}

async function fetchTestSchedule(
  scheduleId: string,
): Promise<TestScheduleItem | null> {
  const res = await fetch("/companion/test-schedules")
  if (!res.ok) return null
  const json = await res.json()
  const schedules: TestScheduleItem[] = json.data ?? []
  return schedules.find((s) => s.id === scheduleId) ?? null
}

function formatScheduleDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

async function postEvent(event: CareCompanionEvent): Promise<void> {
  await fetch("/companion/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  })
}

async function patchEvent(
  id: string,
  patch: Partial<CareCompanionEvent>,
): Promise<void> {
  await fetch(`/companion/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className="font-semibold">
        {match[1]}
      </strong>,
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 ml-4 list-disc space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
      }
      elements.push(
        <ol
          key={`ol-${i}`}
          className="my-1.5 ml-4 list-decimal space-y-0.5"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="h-2" />)
    } else {
      elements.push(
        <p key={`p-${i}`}>{renderInlineMarkdown(line)}</p>,
      )
    }
    i++
  }

  return <div className="space-y-1">{elements}</div>
}

const STATUS_CONFIG: Record<
  TestResultMetric["status"],
  { color: string; bg: string; icon: typeof TrendingUp }
> = {
  NORMAL: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
  LOW: { color: "text-amber-600", bg: "bg-amber-50", icon: TrendingDown },
  HIGH: { color: "text-orange-600", bg: "bg-orange-50", icon: TrendingUp },
  CRITICAL: { color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
}

function MetricCard({ metric }: { metric: TestResultMetric }) {
  const config = STATUS_CONFIG[metric.status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          config.bg,
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{metric.name}</p>
        <p className="text-xs text-muted-foreground">
          Ref: {metric.referenceRange}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-semibold", config.color)}>
          {metric.value} {metric.unit}
        </p>
        <p className={cn("text-[11px] font-medium", config.color)}>
          {metric.status}
        </p>
      </div>
    </div>
  )
}

function TestResultCard({
  result,
  defaultExpanded,
}: {
  result: TestResultEvent
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const abnormalCount = result.metrics.filter(
    (m) => m.status !== "NORMAL",
  ).length

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left active:bg-muted/30"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {result.testName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(result.timestamp)}
            {abnormalCount > 0 && (
              <span className="ml-1.5 text-amber-600">
                · {abnormalCount} flagged
              </span>
            )}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="flex flex-col gap-2">
            {result.metrics.map((metric) => (
              <MetricCard key={metric.name} metric={metric} />
            ))}
          </div>

          {result.aiInsights && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  AI Insights
                </span>
              </div>
              <div className="text-sm text-foreground leading-relaxed">
                <MarkdownContent content={result.aiInsights} />
              </div>
            </div>
          )}

          {!result.aiInsights && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed p-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Generating AI insights...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TestResultsUploadPage() {
  const [searchParams] = useSearchParams()
  const testName = searchParams.get("test")
  const scheduleId = searchParams.get("scheduleId")
  const { data: profile } = useIntakeProfile()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SimulationStatus>("idle")
  const [testResults, setTestResults] = useState<TestResultEvent[]>([])
  const [latestResultId, setLatestResultId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<TestScheduleItem | null>(null)

  const recurringTests = profile?.recurringTests?.selectedTests ?? []

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.TEST_RESULTS.VIEW, {
      testName: testName ?? undefined,
      scheduleId: scheduleId ?? undefined,
    })
  }, [testName, scheduleId])

  useEffect(() => {
    if (scheduleId) {
      fetchTestSchedule(scheduleId).then(setSchedule)
    }
  }, [scheduleId])

  useEffect(() => {
    fetchEvents().then((events) => {
      const results = events
        .filter((e): e is TestResultEvent => e.type === "TEST_RESULT")
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
      setTestResults(results)
    })
  }, [])

  const simulateResults = useCallback(
    async (selectedTest: string, targetScheduleId?: string) => {
      setStatus("generating-results")
      trackEvent(EVENTS.CARE_COMPANION.TEST_RESULTS.UPLOAD_START, {
        testName: selectedTest,
        scheduleId: targetScheduleId,
      })

      try {
        const events = await fetchEvents()
        const metrics = await generateSimulatedTestResults(
          profile,
          events,
          selectedTest,
        )

        if (metrics.length === 0) {
          setStatus("error")
          return
        }

        const resultEvent: TestResultEvent = {
          id: `test-result-${crypto.randomUUID()}`,
          type: "TEST_RESULT",
          timestamp: new Date().toISOString(),
          source: "user",
          testName: selectedTest,
          scheduleId: targetScheduleId ?? null,
          metrics,
          aiInsights: null,
        }

        await postEvent(resultEvent as CareCompanionEvent)
        queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY })

        setTestResults((prev) => [resultEvent, ...prev])
        setLatestResultId(resultEvent.id)
        setStatus("generating-insights")

        const insights = await generateTestResultInsights(
          profile,
          [...events, resultEvent as CareCompanionEvent],
          selectedTest,
          metrics,
        )

        const updatedEvent: TestResultEvent = {
          ...resultEvent,
          aiInsights: insights,
        }

        await patchEvent(resultEvent.id, { aiInsights: insights } as Partial<CareCompanionEvent>)
        queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY })

        setTestResults((prev) =>
          prev.map((r) => (r.id === resultEvent.id ? updatedEvent : r)),
        )
        setStatus("done")

        trackEvent(EVENTS.CARE_COMPANION.TEST_RESULTS.UPLOAD_SUCCESS, {
          testName: selectedTest,
          metricsCount: metrics.length,
        })

        setTimeout(() => setStatus("idle"), 3000)
      } catch (err) {
        console.error("[test-results] Simulation failed:", err)
        setStatus("error")
        trackEvent(EVENTS.CARE_COMPANION.TEST_RESULTS.UPLOAD_ERROR, {
          testName: selectedTest,
        })
      }
    },
    [profile, queryClient],
  )

  const isLoading =
    status === "generating-results" || status === "generating-insights"

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Context banner */}
      <div className="flex items-start gap-3 rounded-xl border bg-primary/5 p-4">
        <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {testName
              ? `${testName} results`
              : "Lab test results"}
          </p>
          {schedule && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Due{" "}
              <span className="font-medium">
                {formatScheduleDate(schedule.expectedDate)}
              </span>
              {schedule.daysUntilTest <= 0
                ? " · Overdue"
                : ` · In ${schedule.daysUntilTest} days`}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            Simulate a test result capture and get AI-powered insights
            about your results.
          </p>
        </div>
      </div>

      {/* Simulate button */}
      {testName && (
        <button
          type="button"
          onClick={() => simulateResults(testName, scheduleId ?? undefined)}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
            "active:bg-muted/50",
            isLoading
              ? "opacity-50 border-muted"
              : "border-primary/30 hover:border-primary/50",
          )}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <FlaskConical className="h-6 w-6 text-primary" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isLoading ? "Generating..." : "Simulate results capture"}
          </span>
        </button>
      )}

      {/* Status messages */}
      {status === "generating-results" && (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm text-foreground">
              Generating test results...
            </p>
            <p className="text-xs text-muted-foreground">
              Creating realistic {testName} values based on your
              profile
            </p>
          </div>
        </div>
      )}

      {status === "generating-insights" && (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          <div>
            <p className="text-sm text-foreground">
              Analyzing your results...
            </p>
            <p className="text-xs text-muted-foreground">
              AI is reviewing your {testName} results
            </p>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-700">
            Results captured with AI insights
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-700">
            Failed to generate results. Please try again.
          </span>
        </div>
      )}

      {/* Recurring tests quick links */}
      {recurringTests.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {testName ? "Other tests" : "Your recurring tests"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {recurringTests
              .filter((test) => test !== testName)
              .map((test) => {
                const sid = `test-sched-${test.replace(/\s+/g, "-").toLowerCase()}`
                return (
                  <a
                    key={test}
                    href={`#/patients/companion/test-results?test=${encodeURIComponent(test)}&scheduleId=${sid}`}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors active:bg-muted/50"
                  >
                    <ClipboardList className="h-3 w-3 text-primary" />
                    {test}
                  </a>
                )
              })}
          </div>
        </div>
      )}

      {/* No test selected — show simulate buttons for each recurring test */}
      {!testName && recurringTests.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Simulate a test
          </h3>
          <div className="flex flex-col gap-2">
            {recurringTests.map((test) => {
              const sid = `test-sched-${test.replace(/\s+/g, "-").toLowerCase()}`
              return (
              <button
                key={test}
                type="button"
                onClick={() => simulateResults(test, sid)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
                  "active:bg-muted/50",
                  isLoading && "opacity-50",
                )}
              >
                <FlaskConical className="h-5 w-5 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {test}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Simulate results capture
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Previous test results */}
      {testResults.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your results
          </h3>
          <div className="flex flex-col gap-3">
            {testResults.map((result) => (
              <TestResultCard
                key={result.id}
                result={result}
                defaultExpanded={result.id === latestResultId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {testResults.length === 0 && status === "idle" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              No test results yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {testName
                ? `Tap "Simulate results capture" to generate ${testName} results`
                : "Select a test above to simulate your first result"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
