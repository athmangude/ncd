import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Sparkles, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/Drawer"
import { trackEvent, EVENTS } from "@/analytics"
import { generateSimulatedTestResults } from "@/lib/ai-pipeline"
import { generateLabResultPdf } from "../utils/generateLabResultPdf"
import {
  intakeProfileQueryKey,
} from "../hooks/useIntakeProfile"
import type { CareCompanionProfile } from "@/types/care-companion"
import type { TestResultMetric } from "@/types/care-companion"

type DrawerState = "idle" | "generating" | "complete"

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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    NORMAL: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    LOW: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    CRITICAL: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  }
  return map[status] ?? "bg-muted text-muted-foreground"
}

export function GenerateLabResultsDrawer({
  open,
  onOpenChange,
  testName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  testName: string
}) {
  const [state, setState] = useState<DrawerState>("idle")
  const [metrics, setMetrics] = useState<TestResultMetric[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: profile } = useQuery<CareCompanionProfile>({
    queryKey: [intakeProfileQueryKey],
  })

  const handleGenerate = useCallback(async () => {
    setState("generating")
    setError(null)
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.GENERATE_TAP, {
      testName,
    })

    try {
      const results = await generateSimulatedTestResults(
        profile ?? null,
        [],
        testName,
      )

      if (results.length === 0) {
        setError("Could not generate results. Please try again.")
        setState("idle")
        return
      }

      setMetrics(results)

      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.GENERATE_SUCCESS, {
        testName,
        metricsCount: results.length,
      })

      setState("complete")
    } catch {
      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.GENERATE_ERROR, {
        testName,
      })
      setError("Something went wrong. Please try again.")
      setState("idle")
    }
  }, [profile, testName])

  const handleDownload = useCallback(async () => {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.DOWNLOAD_PDF, {
      testName,
    })
    await generateLabResultPdf(
      metrics,
      "Jireh Demo Lab",
      new Date().toLocaleDateString("en-KE"),
      profile?.firstName ?? "Patient",
      testName,
    )
  }, [metrics, testName, profile])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setState("idle")
        setMetrics([])
        setError(null)
      }
      onOpenChange(next)
    },
    [onOpenChange],
  )

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate {testName} Results
          </DrawerTitle>
          <DrawerDescription>
            Generate realistic demo test results for this lab entry
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 pb-2">
          {state === "idle" && !error && (
            <div className="rounded-lg bg-accent p-4 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-foreground font-medium">
                Ready to generate
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI will create realistic test metrics for {testName} based on
                your health profile
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {state === "generating" && metrics.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating test results...
                </p>
              </div>
            )}

          {metrics.length > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Results
              </p>
              {metrics.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="text-sm text-foreground">{m.name}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold font-mono",
                        metricStatusColor(m.status),
                      )}
                    >
                      {m.value} {m.unit}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                        statusBadge(m.status),
                      )}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {state === "complete" && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
              <Download className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Download the PDF, then upload it to save to your care history
              </p>
            </div>
          )}
        </div>

        <DrawerFooter>
          {state === "idle" && (
            <Button onClick={handleGenerate}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Results
            </Button>
          )}

          {state === "generating" && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
          )}

          {state === "complete" && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
