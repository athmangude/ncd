import { Button } from "@/components/Button"
import Loader from "@/components/Loader"
import PatientPageWrapper from "../PatientPageWrapper"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowRight, Info } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import useNextKYCStep from "../../hooks/useNextKYCStep"
import { useMutation } from "@tanstack/react-query"
import { SmileIDWrapper } from "@/components/SmileIDWrapper"
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

export function PatientIdSelfie() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const nextStep = useNextKYCStep()
  const [isProcessing, setIsProcessing] = useState(false)

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.KYC.SELFIE_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  // Ensure ID photo exists
  useEffect(() => {
    const idPhoto = localStorage.getItem("idPhotoFront")
    if (!idPhoto) {
      // Redirect back to ID photo step if ID photo is missing
      navigate("/patients/id-photo-front-upload", { state: location.state })
    }
  }, [navigate, location.state])

  const verifyMutation = useMutation({
    mutationFn: async (images: any[]) => {
      const idPhotoString = localStorage.getItem("idPhotoFront")

      // Find selfie (type 2) from SmileID results
      const selfieImage = images.find(
        (img: any) => img.image_type_id === 2
      )?.image

      if (!selfieImage || !idPhotoString) {
        throw new Error("Missing photos. Please try again.")
      }

      const formatBase64 = (b64: string) => {
        if (b64.startsWith("data:")) return b64
        return `data:image/jpeg;base64,${b64}`
      }

      const idPhotoBlob = dataURLtoBlob(formatBase64(idPhotoString))
      const selfieBlob = dataURLtoBlob(formatBase64(selfieImage))

      const formData = new FormData()
      formData.append("idDocument", idPhotoBlob, "id-photo.jpg")
      formData.append("selfie", selfieBlob, "selfie.jpg")

      return { success: true }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Verification successful!",
      })

      // Clear storage after successful upload
      localStorage.removeItem("idPhotoFront")
      localStorage.removeItem("idSelfie")

      // Navigate to next step
      navigate(nextStep || "/patients", { state: location.state })
    },
    onError: (error: any) => {
      console.error("Verification failed", error)
      toast({
        title: "Verification Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Could not verify photos. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    },
  })

  const handleSmileIDSuccess = (detail: any) => {
    setIsProcessing(true)
    const { images } = detail

    // Track selfie submission with capture context
    // SELFIE_CAPTURE is implicit in a successful SmileID callback
    try {
      trackEvent(EVENTS.KYC.SELFIE_SUBMIT, {
        captureMethod: "smileId",
        imageCount: images?.length ?? 0,
      })
    } catch {
      // Silent fail
    }
    verifyMutation.mutate(images)
  }

  return (
    <PatientPageWrapper title="Take a Selfie" className="items-center px-4">
      <div className="w-full flex flex-col gap-6">
        <div className="text-center mb-4">
          <h1>Take a clear photo of yourself</h1>
          <p className="text-muted-foreground text-sm">
            Please take a clear selfie to verify that it matches your ID photo.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate("/patients/id-selfie-guide")}
          className="flex items-center justify-between w-full p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <Info className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Taking a good selfie
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </Button>

        {isProcessing ? (
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

export default PatientIdSelfie
