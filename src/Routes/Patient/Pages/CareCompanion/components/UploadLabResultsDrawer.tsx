import { useState, useCallback, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Upload,
  Loader2,
  CheckCircle2,
  FileText,
  Image,
  X,
  Sparkles,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
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
import { dataService } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import {
  extractMetricsFromLabDocument,
  generateTestResultInsights,
} from "@/lib/ai-pipeline"
import {
  intakeProfileQueryKey,
} from "../hooks/useIntakeProfile"
import { clinicalVisitsQueryKey } from "../hooks/useClinicalVisits"
import type { CareCompanionProfile } from "@/types/care-companion"
import type { TestResultMetric } from "@/types/care-companion"

type DrawerState =
  | "idle"
  | "file-selected"
  | "uploading"
  | "processing"
  | "results-extracted"
  | "generating-insights"
  | "complete"

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ACCEPTED_TYPES = "application/pdf,image/jpeg,image/jpg,image/png"
const MAX_SIZE = 10 * 1024 * 1024

export function UploadLabResultsDrawer({
  open,
  onOpenChange,
  testName,
  paymentId,
  userId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  testName: string
  paymentId: string
  userId: string
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<DrawerState>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [metrics, setMetrics] = useState<TestResultMetric[]>([])
  const [insight, setInsight] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: profile } = useQuery<CareCompanionProfile>({
    queryKey: [intakeProfileQueryKey],
  })

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (!selected) return

      if (selected.size > MAX_SIZE) {
        setError("File is too large. Maximum size is 10 MB.")
        return
      }

      setFile(selected)
      setError(null)
      setState("file-selected")
      trackEvent(
        EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.UPLOAD_FILE_SELECTED,
        {
          testName,
          fileType: selected.type,
          fileSize: selected.size,
        },
      )
    },
    [testName],
  )

  const handleUpload = useCallback(async () => {
    if (!file) return

    setState("uploading")
    setError(null)
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.UPLOAD_TAP, {
      testName,
      paymentId,
    })

    try {
      const ext = file.name.split(".").pop() ?? "pdf"
      const storagePath = `${userId}/${paymentId}/${testName.replace(/\s+/g, "-").toLowerCase()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("lab-results")
        .upload(storagePath, file, { upsert: true })

      if (uploadError) {
        setError("Upload failed. Please try again.")
        setState("file-selected")
        trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.UPLOAD_ERROR, {
          testName,
          error: uploadError.message,
        })
        return
      }

      setState("processing")

      const base64 = await fileToBase64(file)
      const extracted = await extractMetricsFromLabDocument(
        base64,
        file.type,
        testName,
      )

      setMetrics(extracted)
      setState("generating-insights")

      let insightText: string | null = null
      if (extracted.length > 0) {
        insightText = await generateTestResultInsights(
          profile ?? null,
          [],
          testName,
          extracted,
        )
        setInsight(insightText)
      }

      await dataService.insert("events", {
        user_id: userId,
        type: "TEST_RESULT",
        data: {
          testName,
          metrics: extracted,
          labName: "Uploaded Document",
          date: new Date().toISOString().split("T")[0],
          paymentId,
          lineItemName: testName,
          uploadedFilePath: storagePath,
          source: "uploaded",
        },
      })

      if (
        insightText &&
        insightText !== "AI insights are not available right now."
      ) {
        await dataService.insert("events", {
          user_id: userId,
          type: "AI_INSIGHT",
          data: {
            title: `AI Insight: ${testName}`,
            body: insightText,
            paymentId,
            lineItemName: testName,
          },
        })
        trackEvent(
          EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.INSIGHTS_GENERATED,
          { testName },
        )
      }

      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.UPLOAD_SUCCESS, {
        testName,
        metricsCount: extracted.length,
      })

      await queryClient.invalidateQueries({
        queryKey: [clinicalVisitsQueryKey],
      })
      setState("complete")
    } catch {
      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_TIMELINE.UPLOAD_ERROR, {
        testName,
      })
      setError("Something went wrong. Please try again.")
      setState("file-selected")
    }
  }, [file, testName, paymentId, userId, profile, queryClient])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setState("idle")
        setFile(null)
        setMetrics([])
        setInsight(null)
        setError(null)
      }
      onOpenChange(next)
    },
    [onOpenChange],
  )

  const clearFile = useCallback(() => {
    setFile(null)
    setState("idle")
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const isPdf = file?.type === "application/pdf"

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload {testName} Results
          </DrawerTitle>
          <DrawerDescription>
            Upload a PDF or photo of your lab results
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 pb-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {(state === "idle" || state === "file-selected") && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                className="hidden"
              />

              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8 transition-colors active:bg-primary/10"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-8 w-8 text-primary/60" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Tap to select file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF or JPEG, max 10 MB
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  {isPdf ? (
                    <FileText className="h-8 w-8 shrink-0 text-red-500" />
                  ) : (
                    <Image className="h-8 w-8 shrink-0 text-blue-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="shrink-0 rounded-full p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </>
          )}

          {(state === "uploading" || state === "processing") && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {state === "uploading"
                  ? "Uploading file..."
                  : "Extracting metrics with AI..."}
              </p>
            </div>
          )}

          {state === "generating-insights" && metrics.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Processing results...
              </p>
            </div>
          )}

          {metrics.length > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Extracted Results
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

          {state === "generating-insights" && metrics.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Generating AI insights...
              </p>
            </div>
          )}

          {insight && state === "complete" && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                    AI Insight
                  </p>
                  <div className="text-xs text-foreground leading-relaxed prose prose-xs prose-amber max-w-none [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_ol]:mb-1.5 [&_li]:mb-0.5 [&_strong]:text-foreground">
                    <ReactMarkdown>{insight}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === "complete" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Results uploaded and saved to your care history
              </p>
            </div>
          )}
        </div>

        <DrawerFooter>
          {state === "idle" && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Select File
            </Button>
          )}

          {state === "file-selected" && (
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Process
            </Button>
          )}

          {(state === "uploading" ||
            state === "processing" ||
            state === "generating-insights") && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {state === "uploading"
                ? "Uploading..."
                : state === "processing"
                  ? "Processing..."
                  : "Generating insights..."}
            </Button>
          )}

          {state === "complete" && (
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
