import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { dataService } from "@/lib/data-service"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import {
  FlaskConical,
  Download,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react"
import type { CareCompanionProfile } from "@/types/care-companion"

import {
  generateLabResultPdf,
  type LabResultMetric,
} from "@/Routes/Patient/Pages/CareCompanion/utils/generateLabResultPdf"

interface TestResult {
  metrics: LabResultMetric[]
  labName: string
  date: string
}

const STATUS_CONFIG: Record<
  LabResultMetric["status"],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  NORMAL: {
    label: "Normal",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  LOW: {
    label: "Low",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertTriangle,
  },
  HIGH: {
    label: "High",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critical",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
}

export default function TestResultsUtility() {
  const navigate = useNavigate()
  const [generatingTest, setGeneratingTest] = useState<string | null>(null)
  const [generatedResults, setGeneratedResults] = useState<
    Map<string, TestResult>
  >(new Map())
  const [downloadingTest, setDownloadingTest] = useState<string | null>(null)

  const { data: profile } = useQuery({
    queryKey: ["careCompanionIntakeProfile"],
    queryFn: () =>
      dataService.query<CareCompanionProfile>("profiles", { single: true }),
  })

  const { data: events } = useQuery({
    queryKey: ["events", "PAYMENT"],
    queryFn: () =>
      dataService.query<Array<{ type: string; data: { lineItems?: Array<{ category?: string; name?: string }> } }>>(
        "events",
        {
          filter: { type: "PAYMENT" },
          order: { column: "created_at", ascending: false },
          limit: 20,
        },
      ),
  })

  const testNames = (() => {
    const fromProfile = new Set(
      profile?.recurringTests?.selectedTests ?? [],
    )

    if (events) {
      for (const event of events) {
        const lineItems = event.data?.lineItems ?? []
        for (const item of lineItems) {
          if (item.category === "LAB_TEST" && item.name) {
            fromProfile.add(item.name)
          }
        }
      }
    }

    return Array.from(fromProfile)
  })()

  const handleGenerate = useCallback(
    async (testName: string) => {
      setGeneratingTest(testName)
      try {
        const result = await dataService.invokeFunction<TestResult>(
          "generate-mock-test-results",
          { testName },
        )
        setGeneratedResults((prev) => new Map(prev).set(testName, result))
      } catch {
        // Generation failed silently — button stays available to retry
      } finally {
        setGeneratingTest(null)
      }
    },
    [],
  )

  const handleDownloadPdf = useCallback(
    async (testName: string) => {
      const result = generatedResults.get(testName)
      if (!result) return
      setDownloadingTest(testName)
      try {
        const patientName = profile?.firstName ?? "Patient"
        await generateLabResultPdf(
          result.metrics,
          result.labName,
          result.date,
          patientName,
          testName,
        )
      } finally {
        setDownloadingTest(null)
      }
    },
    [generatedResults, profile],
  )

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">
          Test Results Utility
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate mock lab results for demo and testing purposes.
        </p>
      </div>

      {testNames.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <FlaskConical className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No tests found. Complete your health profile to add recurring tests.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {testNames.map((testName) => {
            const result = generatedResults.get(testName)
            const isGenerating = generatingTest === testName
            const isDownloading = downloadingTest === testName

            return (
              <div
                key={testName}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {testName}
                      </p>
                      {result && (
                        <p className="text-xs text-muted-foreground">
                          {result.labName} &middot; {result.date}
                        </p>
                      )}
                    </div>
                  </div>

                  {!result && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerate(testName)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Generating
                        </>
                      ) : (
                        "Generate Results"
                      )}
                    </Button>
                  )}
                </div>

                {result && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Metric
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Result
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Reference
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.metrics.map((metric) => {
                            const config = STATUS_CONFIG[metric.status]
                            const StatusIcon = config.icon
                            return (
                              <tr
                                key={metric.name}
                                className="border-b border-border last:border-0"
                              >
                                <td className="px-3 py-2 font-medium text-foreground">
                                  {metric.name}
                                </td>
                                <td className="px-3 py-2 text-foreground">
                                  {metric.value} {metric.unit}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {metric.referenceRange}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                                      config.className,
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {config.label}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(testName)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="mr-1 h-3 w-3" />
                        )}
                        Download PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(
                            `/patients/companion/test-results?test=${encodeURIComponent(testName)}`,
                          )
                        }
                      >
                        Upload these results
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
