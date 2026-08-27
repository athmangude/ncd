import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  Image as ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/analytics/tracking"
import { EVENTS } from "@/analytics/events"
import { useIntakeProfile } from "./hooks/useIntakeProfile"

type UploadStatus = "idle" | "uploading" | "success" | "error"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  previewUrl: string | null
  uploadedAt: string
  testName: string | null
}

const STORAGE_KEY = "jireh:test-result-uploads"

function loadUploads(): UploadedFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UploadedFile[]) : []
  } catch {
    return []
  }
}

function saveUploads(uploads: UploadedFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads))
  } catch {
    // storage full
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

export default function TestResultsUploadPage() {
  const [searchParams] = useSearchParams()
  const testName = searchParams.get("test")
  const { data: profile } = useIntakeProfile()
  const [uploads, setUploads] = useState<UploadedFile[]>(loadUploads)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const recurringTests = profile?.recurringTests?.selectedTests ?? []

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.TEST_RESULTS.VIEW, {
      testName: testName ?? undefined,
    })
  }, [testName])

  function simulateUpload(file: File) {
    setStatus("uploading")

    trackEvent(EVENTS.CARE_COMPANION.TEST_RESULTS.UPLOAD_START, {
      fileName: file.name,
      fileSize: file.size,
      testName: testName ?? undefined,
    })

    const isImage = file.type.startsWith("image/")
    const previewUrl = isImage ? URL.createObjectURL(file) : null

    setTimeout(() => {
      const uploaded: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        uploadedAt: new Date().toISOString(),
        testName,
      }
      const next = [uploaded, ...uploads]
      setUploads(next)
      saveUploads(
        next.map((u) => ({ ...u, previewUrl: null })),
      )
      setStatus("success")

      trackEvent(EVENTS.CARE_COMPANION.TEST_RESULTS.UPLOAD_SUCCESS, {
        fileName: file.name,
        testName: testName ?? undefined,
      })

      setTimeout(() => setStatus("idle"), 3000)
    }, 1500)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) simulateUpload(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Context banner */}
      {testName && (
        <div className="flex items-start gap-3 rounded-xl border bg-primary/5 p-4">
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Upload your {testName} results
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tracking your test results helps you and your doctor
              monitor your progress over time.
            </p>
          </div>
        </div>
      )}

      {!testName && (
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Upload lab test results
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Take a photo or upload a file of your lab results. Your
              care team can track trends and flag anything important.
            </p>
          </div>
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={status === "uploading"}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
            "active:bg-muted/50",
            status === "uploading"
              ? "opacity-50"
              : "border-primary/30 hover:border-primary/50",
          )}
        >
          <Camera className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Take photo
          </span>
          <span className="text-[11px] text-muted-foreground">
            Use your camera
          </span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={status === "uploading"}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
            "active:bg-muted/50",
            status === "uploading"
              ? "opacity-50"
              : "border-muted-foreground/30 hover:border-muted-foreground/50",
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Upload file
          </span>
          <span className="text-[11px] text-muted-foreground">
            PDF, image, or document
          </span>
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload status */}
      {status === "uploading" && (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-foreground">
            Uploading your results...
          </span>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-700">
            Results uploaded successfully
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-700">
            Upload failed. Please try again.
          </span>
        </div>
      )}

      {/* Recurring tests quick links */}
      {recurringTests.length > 0 && !testName && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your recurring tests
          </h3>
          <div className="flex flex-wrap gap-2">
            {recurringTests.map((test) => (
              <a
                key={test}
                href={`#/patients/companion/test-results?test=${encodeURIComponent(test)}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors active:bg-muted/50"
              >
                <ClipboardList className="h-3 w-3 text-primary" />
                {test}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Previously uploaded files */}
      {uploads.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Uploaded results
          </h3>
          <div className="flex flex-col gap-2">
            {uploads.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.testName
                      ? `${file.testName} — ${file.name}`
                      : file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} ·{" "}
                    {formatDate(file.uploadedAt)}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
