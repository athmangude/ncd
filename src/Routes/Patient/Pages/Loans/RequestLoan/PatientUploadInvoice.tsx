import { useMutation } from "@tanstack/react-query"
import PatientPageWrapper from "../../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS } from "@/analytics"
import { Progress } from "@/components/Progress"
import { Button } from "@/components/Button"
import { SectionTitle } from "@/components/SectionTitle"
import { Input } from "@/components/Input"
import Loader from "@/components/Loader"
import {
  CheckCircle,
  Info,
  Trash2,
  Plus,
  ArrowRight,
  FileText,
  HelpCircle,
  Phone,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import useNextLoanApplicationStep from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import { Checkbox } from "@/components/Checkbox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion"
import invoiceInvalid from "@/assets/icons/invoice-invalid.png"
import pdfPlaceholder from "@/assets/icons/pdf-placeholder.png"
import clock from "@/assets/icons/clock.png"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { setToLocalStorage } from "@/utilities/localStorage"

export const patientReviewInvoiceStorageKey = "patientReviewInvoice"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const allowedFileTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/pdf",
]

type FileUploadStatus = "idle" | "uploading" | "uploaded" | "failed"

interface UploadedFile {
  id: string
  file: File
  preview?: string
  status: FileUploadStatus
  progress: number
  error?: string
  fileId?: string
}

export default function PatientUploadInvoice() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const next = useNextLoanApplicationStep()
  const location = useLocation()
  const state = location.state
  const user = usePatientAuthStore((state: any) => state.user)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptedMedicalConsent, setAcceptedMedicalConsent] = useState(
    user?.hasAcceptedMedicalConsentForm ?? false
  )
  const [uploadError, setUploadError] = useState(false)

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.PAYMENT.UPLOAD_INVOICE_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, fileId }: { file: File; fileId: string }) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/upload-medical-invoice",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadedFiles((prev) => {
                const updated = [...prev]
                const fileIndex = updated.findIndex((f) => f.id === fileId)
                if (fileIndex !== -1) {
                  updated[fileIndex] = { ...updated[fileIndex], progress }
                }
                return updated
              })
            }
          },
        }
      )

      return response.data
    },
    onSuccess: (data: any, variables) => {
      try {
        trackEvent(EVENTS.PAYMENT.UPLOAD_INVOICE_SUCCESS, {
          fileId: data?.invoiceFile?.id,
        })
      } catch {
        // Silent fail
      }
      setUploadedFiles((prev) => {
        const updated = [...prev]
        const fileIndex = updated.findIndex((f) => f.id === variables.fileId)
        if (fileIndex !== -1) {
          updated[fileIndex] = {
            ...updated[fileIndex],
            status: "uploaded",
            progress: 100,
            fileId: data.invoiceFile.id,
          }
        }
        return updated
      })
    },
    onError: (error: any, variables) => {
      try {
        trackEvent(EVENTS.PAYMENT.UPLOAD_INVOICE_ERROR, {
          errorMessage: error?.response?.data?.message || error?.message,
        })
      } catch {
        // Silent fail
      }
      setUploadedFiles((prev) => {
        const updated = [...prev]
        const fileIndex = updated.findIndex((f) => f.id === variables.fileId)
        if (fileIndex !== -1) {
          updated[fileIndex] = {
            ...updated[fileIndex],
            status: "failed",
            error:
              error.response?.data?.message ||
              "Upload failed. Check your network and try again.",
          }
        }
        return updated
      })
      toast({
        title: "Error uploading invoice",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      trackEvent(EVENTS.PAYMENT.UPLOAD_INVOICE_START, {
        fileCount: files.length,
      })
    } catch {
      // Silent fail
    }

    const validFiles: File[] = []

    // First, validate all files
    Array.from(files).forEach((file) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `File size must be less than 10MB. ${file.name} is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          variant: "destructive",
        })
        return
      }

      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `File type must be PDF, PNG, JPG, or HEIC. ${file.name} is not supported.`,
          variant: "destructive",
        })
        return
      }

      validFiles.push(file)
    })

    // Create new file objects
    const newFiles: UploadedFile[] = validFiles.map((file) => {
      // Create preview for images
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined

      return {
        id: `${Date.now()}-${Math.random()}-${Math.random()}`,
        file,
        preview,
        status: "idle",
        progress: 0,
      }
    })

    // Add files to state
    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  const handleRetryUpload = (fileId: string) => {
    setUploadedFiles((prev) => {
      const fileIndex = prev.findIndex((f) => f.id === fileId)
      const file = prev[fileIndex]
      if (file && fileIndex !== -1) {
        const updated = [...prev]
        updated[fileIndex] = {
          ...updated[fileIndex],
          status: "uploading",
          progress: 0,
          error: undefined,
        }
        // Start upload after state update
        setTimeout(() => {
          uploadFileMutation.mutate({ file: file.file, fileId })
        }, 0)
        return updated
      }
      return prev
    })
  }

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please add at least one invoice file.",
        variant: "destructive",
      })
      return
    }

    if (!acceptedMedicalConsent) {
      toast({
        title: "Consent required",
        description: "Please provide consent to proceed.",
        variant: "destructive",
      })
      return
    }

    const filesToUpload = uploadedFiles.filter((f) => f.status !== "uploaded")

    if (filesToUpload.length === 0) {
      const alreadyUploadedFileIds = uploadedFiles
        .filter((f) => f.status === "uploaded" && f.fileId)
        .map((f) => f.fileId as string)

      if (alreadyUploadedFileIds.length === 0) {
        toast({
          title: "No files to upload",
          description: "Please add at least one invoice file.",
          variant: "destructive",
        })
        return
      }

      navigate(next, {
        state: {
          ...state,
          fileIds: alreadyUploadedFileIds,
        },
      })
      return
    }

    setIsSubmitting(true)

    // Set files that are about to be uploaded to uploading state
    setUploadedFiles((prev) =>
      prev.map((file) =>
        filesToUpload.some((f) => f.id === file.id)
          ? { ...file, status: "uploading", progress: 0, error: undefined }
          : file
      )
    )

    try {
      const results = await Promise.all(
        filesToUpload.map((file) =>
          uploadFileMutation.mutateAsync({ file: file.file, fileId: file.id })
        )
      )

      const newlyUploadedFileIds = results
        .map((data: any) => data?.invoiceFile?.id)
        .filter(Boolean) as string[]

      const previouslyUploadedFileIds = uploadedFiles
        .filter((f) => f.status === "uploaded" && f.fileId)
        .map((f) => f.fileId as string)

      const uploadedFileIds = [
        ...previouslyUploadedFileIds,
        ...newlyUploadedFileIds,
      ]

      if (uploadedFileIds.length === 0) {
        toast({
          title: "Upload failed",
          description:
            "We couldn't upload your invoice. Please check your network and try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setUploadError(true)
        return
      }

      // Check if we received extracted data from the API
      const extractedDataResponse = results.find(
        (r: any) => r.patient || r.dependent || r.kmpdcFacility || r.billAmount
      )

      if (extractedDataResponse) {
        // Save the full API response to localStorage for persistent storage
        setToLocalStorage(patientReviewInvoiceStorageKey, extractedDataResponse)

        navigate(next, {
          state: {
            ...state,
            fileIds: uploadedFileIds,
          },
        })
        return
      }

      navigate(next, {
        state: {
          ...state,
          fileIds: uploadedFileIds,
        },
      })
    } catch {
      // Errors are already handled in the mutation's onError
      setIsSubmitting(false)
      setUploadError(true)
    }
  }

  const hasSelectedFiles = uploadedFiles.length > 0
  const canSubmit = acceptedMedicalConsent && hasSelectedFiles

  if (uploadError) {
    const missingPatientError = uploadedFiles.find((f) =>
      f.error?.includes("not found in your network")
    )

    return (
      <PatientPageWrapper
        variant="content"
        showHelp
        headerIcon={
          <img src={invoiceInvalid} alt="" className={HERO_ILLUSTRATION} />
        }
        pageTitle="There was a problem..."
        description={
          missingPatientError
            ? missingPatientError.error
            : "The file(s) you have provided do not seem to be a valid medical invoice."
        }
      >
        <div className="flex flex-col items-center gap-6">
          {/* Try Again / Add Connection Button */}
          <div className="w-full max-w-md px-4">
            {missingPatientError ? (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() =>
                  navigate("/patients/network/add-connection", {
                    state: {
                      from: "upload-invoice",
                    },
                  })
                }
              >
                Add Connection
              </Button>
            ) : (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => setUploadError(false)}
              >
                Try again
              </Button>
            )}
          </div>

          {/* Help Accordion */}
          <div className="w-full max-w-md px-4 mt-4">
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="p-4 border-b bg-muted">
                <h3>Have a problem with your invoice?</h3>
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b px-4">
                  <AccordionTrigger className="py-3 text-sm text-muted-foreground hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>The details don't match the invoice uploaded</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground px-7">
                    Please ensure that the invoice details entered match exactly
                    what is shown on the uploaded document.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b px-4">
                  <AccordionTrigger className="py-3 text-sm text-muted-foreground hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>How to find downloaded files on your phone</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground px-7">
                    Check your phone's "Downloads" or "Files" app. Most devices
                    sort files by date, so your most recent download should be
                    at the top.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="px-4 border-none">
                  <AccordionTrigger className="py-3 text-sm text-muted-foreground hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Invoice is not valid?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground px-7">
                    Ensure the image is clear, all text is readable, and it
                    contains the facility name, patient name, and billing
                    details.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Contact Support */}
          <div className="w-full max-w-md px-4 mb-8">
            <h3 className="mb-3">Need more help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Contact our support team
            </p>
            <a
              href="tel:+254117118511"
              className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Call Jireh Support
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      </PatientPageWrapper>
    )
  }

  if (isSubmitting) {
    return (
      <PatientPageWrapper title="Uploading invoice" showHelp>
        <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-6">
          <div className="relative">
            <FileText
              className="w-20 h-20 text-muted-foreground/40"
              strokeWidth={1}
            />
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
              <img
                src={clock}
                alt="Invoice"
                className="w-24 h-24 object-contain"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-foreground">Processing your invoice...</h2>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm">
              You should receive an update in a couple of seconds
            </p>

            <div className="flex justify-center items-center py-4">
              <Loader className="w-12 h-12" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4 w-full max-w-sm mt-8 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Next step:
            </p>
            <p className="text-sm font-semibold text-foreground">
              Confirm invoice details
            </p>
          </div>
        </div>
      </PatientPageWrapper>
    )
  }

  return (
    <PatientPageWrapper
      variant="content"
      showHelp
      pageTitle="Upload a photo of your invoice."
      description="Add single or multiple files (PDF, PNG, JPG, HEIC) up to 10MB each."
    >
      <div className="flex flex-col gap-6">
        {/* Guide Banner */}
        <Button
          type="button"
          onClick={() =>
            navigate("/patients/payment/request-payment/invoice-guide")
          }
          className="flex p-2 bg-accent hover:bg-accent rounded-lg border border-border"
        >
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center">
              <Info className="text-accent-foreground" />
            </div>
            <span className="text-sm font-medium text-accent-foreground">
              Taking a good invoice photo
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <SectionTitle>Your invoice</SectionTitle>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <FileUploadCard
                  key={uploadedFile.id}
                  file={uploadedFile}
                  onDelete={() => handleDeleteFile(uploadedFile.id)}
                  onRetry={() => handleRetryUpload(uploadedFile.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add Photo Button */}
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.heic"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploadFileMutation.isPending}
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadFileMutation.isPending}
        >
          <Plus />
          Add a photo
        </Button>

        {/* Consent Checkbox */}
        {!user.hasAcceptedMedicalConsentForm && (
          <div className="bg-white rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedMedicalConsent}
                onCheckedChange={() =>
                  setAcceptedMedicalConsent(!acceptedMedicalConsent)
                }
              />
              <label htmlFor="consent" className="text-sm cursor-pointer">
                I give my consent for Jireh to use my medical data for the
                purpose of providing healthcare financing services.
              </label>
            </div>
            <Link
              to="/patients/medical-consent-form"
              className="text-sm text-primary hover:underline ml-7"
            >
              Read more →
            </Link>
          </div>
        )}
        {/* Submit Button */}
        <Button
          type="button"
          className="w-full"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Submit invoice
        </Button>
      </div>
    </PatientPageWrapper>
  )
}

function FileUploadCard({
  file,
  onDelete,
  onRetry,
}: {
  file: UploadedFile
  onDelete: () => void
  onRetry: () => void
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-4 flex items-center gap-4">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
        {file.preview ? (
          <img
            src={file.preview}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : file.file.type === "application/pdf" ? (
          <img
            src={pdfPlaceholder}
            alt="PDF document"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 bg-muted-foreground/30 rounded flex items-center justify-center">
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {file.file.name}
        </p>
        {file.status === "uploading" && (
          <div className="mt-2 space-y-1">
            <Progress value={file.progress} className="h-1" />
            <p className="text-xs text-primary flex items-center gap-1">
              <Loader className="w-3 h-3" />
              Uploading...
            </p>
          </div>
        )}
        {file.status === "uploaded" && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Uploaded!
          </p>
        )}
        {file.status === "failed" && (
          <div className="mt-1 space-y-1">
            <p className="text-xs text-red-600 font-medium">Upload failed.</p>
            <p className="text-xs text-red-600">{file.error}</p>
            <Button
              type="button"
              onClick={onRetry}
              className="text-xs text-white hover:underline mt-1"
            >
              Try again
            </Button>
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        className="flex-shrink-0 text-red-500 hover:text-red-700 p-1"
        aria-label="Delete file"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}
