import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import PatientPageWrapper from "../PatientPageWrapper"
import useNextKYCStep from "../../hooks/useNextKYCStep"
import { SmileIDWrapper } from "@/components/SmileIDWrapper"
import Loader from "@/components/Loader"
import { Alert, AlertTitle, AlertDescription } from "@/components/Alert"
import { Button } from "@/components/Button"
import { AlertTriangle } from "lucide-react"
import { trackEvent, EVENTS } from "@/analytics"

// Helper to convert data URL to Blob
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(",")
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export default function PatientDocumentVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const nextStep = useNextKYCStep()
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationFailed, setVerificationFailed] = useState(false)

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.KYC.DOCUMENT_VERIFICATION_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const verifyMutation = useMutation({
    mutationFn: async (images: any[]) => {
      // Find selfie (type 2) and ID card (type 3 - Front)
      const selfieImage = images.find(
        (img: any) => img.image_type_id === 2
      )?.image
      const idImage = images.find((img: any) => img.image_type_id === 3)?.image

      if (!selfieImage || !idImage) {
        throw new Error(
          "Could not capture all required images. Please try again."
        )
      }

      const formatBase64 = (b64: string) => {
        if (b64.startsWith("data:")) return b64
        return `data:image/jpeg;base64,${b64}`
      }

      const idPhotoBlob = dataURLtoBlob(formatBase64(idImage))
      const selfieBlob = dataURLtoBlob(formatBase64(selfieImage))

      const formData = new FormData()
      formData.append("idDocument", idPhotoBlob, "id-photo.jpg")
      formData.append("selfie", selfieBlob, "selfie.jpg")

      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL +
          "/patients/verify-id-photo-selfie-match",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Verification submitted successfully!",
      })

      navigate(nextStep || "/patients", { state: location.state })
    },
    onError: (error: any) => {
      console.error("Verification failed", error)
      setVerificationFailed(true)
      setIsProcessing(false)
    },
  })

  const handleSmileIDSuccess = (detail: any) => {
    try {
      trackEvent(EVENTS.KYC.DOCUMENT_VERIFICATION_SUBMIT)
    } catch {
      // Silent fail
    }
    setIsProcessing(true)
    const { images } = detail
    verifyMutation.mutate(images)
  }

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle="Verify Identity"
      description={
        verificationFailed
          ? undefined
          : "Follow the instructions to capture your selfie and front photo of your ID."
      }
      className="items-center"
    >
      <div className="w-full flex flex-col gap-6">
        {verificationFailed ? (
          <Alert variant="warning" className="rounded-xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <AlertTitle className="mb-2">Verification Pending</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>
                Automatic verification failed. Please wait for our admin
                verification.
              </p>
              <p className="text-sm">
                An SMS will be sent to you when that is completed.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/patients")}
                className="mt-2 self-center"
              >
                Return to Home
              </Button>
            </AlertDescription>
          </Alert>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary mb-1" />
            <p>Verifying your identity...</p>
          </div>
        ) : (
          <div className="w-full bg-muted rounded-xl overflow-hidden border border-border">
            <div className="m-3">
              <SmileIDWrapper onSuccess={handleSmileIDSuccess} />
            </div>
          </div>
        )}
      </div>
    </PatientPageWrapper>
  )
}
