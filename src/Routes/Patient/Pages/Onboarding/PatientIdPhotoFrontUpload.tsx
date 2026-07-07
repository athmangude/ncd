import { Button } from "@/components/Button"
import PatientPageWrapper from "../PatientPageWrapper"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowRight, Info } from "lucide-react"
import useNextKYCStep from "../../hooks/useNextKYCStep"
import { SmileIDWrapper } from "@/components/SmileIDWrapper"
import Loader from "@/components/Loader"

export function PatientIdPhotoFrontUpload() {
  const navigate = useNavigate()
  const location = useLocation()
  const nextStep = useNextKYCStep()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSmileIDSuccess = (detail: any) => {
    setIsProcessing(true)
    const { images } = detail

    // Find ID card (type 3 - Front)
    const idImage = images.find((img: any) => img.image_type_id === 3)?.image

    if (!idImage) {
      setIsProcessing(false)
      return
    }

    const formatBase64 = (b64: string) => {
      if (b64.startsWith("data:")) return b64
      return `data:image/jpeg;base64,${b64}`
    }

    // Store ID photo in localStorage for the selfie step
    const formattedIdImage = formatBase64(idImage)
    localStorage.setItem("idPhotoFront", formattedIdImage)

    // Immediately navigate to next step (selfie) to prevent selfie frame from showing
    // Use setTimeout with 0 delay to ensure navigation happens after state update
    setTimeout(() => {
      navigate(nextStep || "/patients", { state: location.state })
    }, 0)
  }

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle="Add a photo of your National ID card"
      description="Please capture a clear photo of the front of your National ID card."
      className="items-center"
    >
      <div className="w-full flex flex-col gap-6">
        <Button
          type="button"
          onClick={() => navigate("/patients/id-photo-guide")}
          className="flex items-center justify-between w-full p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <Info className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Taking a good ID photo
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </Button>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary mb-1" />
            <p>Processing your ID photo...</p>
          </div>
        ) : (
          <div className="w-full bg-muted rounded-xl overflow-hidden border border-border">
            <div className="m-3">
              <SmileIDWrapper
                onSuccess={handleSmileIDSuccess}
                captureMode="id"
              />
            </div>
          </div>
        )}
      </div>
    </PatientPageWrapper>
  )
}

export default PatientIdPhotoFrontUpload
