import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import PatientPageWrapper from "../PatientPageWrapper"
import useNextKYCStep from "../../hooks/useNextKYCStep"
import { SmileIDWrapper } from "@/components/SmileIDWrapper"
import Loader from "@/components/Loader"
import { trackEvent, EVENTS } from "@/analytics"

// Helper to convert data URL to Blob
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg' 
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
      const selfieImage = images.find((img: any) => img.image_type_id === 2)?.image
      const idImage = images.find((img: any) => img.image_type_id === 3)?.image

      if (!selfieImage || !idImage) {
          throw new Error("Could not capture all required images. Please try again.")
      }

      const formatBase64 = (b64: string) => {
        if (b64.startsWith('data:')) return b64;
        return `data:image/jpeg;base64,${b64}`;
      };

      const idPhotoBlob = dataURLtoBlob(formatBase64(idImage))
      const selfieBlob = dataURLtoBlob(formatBase64(selfieImage))

      const formData = new FormData()
      formData.append("idDocument", idPhotoBlob, "id-photo.jpg")
      formData.append("selfie", selfieBlob, "selfie.jpg")

      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/verify-id-photo-selfie-match",
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
    }
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
      title="Identity Verification"
      className="items-center px-4"
    >
      <div className="w-full flex flex-col gap-6">
        <div className="text-center mb-4">
            <h1 className="text-xl font-semibold">Verify Identity</h1>
            {!verificationFailed && (
                <p className="text-neutral-500 text-sm">
                    Follow the instructions to capture your selfie and front photo of your ID.
                </p>
            )}
        </div>

        {verificationFailed ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-amber-900 mb-2">Verification Pending</h3>
                <p className="text-amber-800 mb-4">
                    Automatic verification failed. Please wait for our admin verification.
                </p>
                <p className="text-sm text-amber-700">
                    An SMS will be sent to you when that is completed.
                </p>
                <button 
                    onClick={() => navigate('/patients')} 
                    className="mt-6 px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium text-sm"
                >
                    Return to Home
                </button>
            </div>
        ) : isProcessing ? (
             <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-8 h-8 text-primary mb-1" />
                <p>Verifying your identity...</p>
             </div>
        ) : (
            <div className="w-full bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200" >
              <div className="m-3">
                <SmileIDWrapper onSuccess={handleSmileIDSuccess} />
                </div>
            </div>
        )}
      </div>
    </PatientPageWrapper>
  )
}
