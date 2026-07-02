import { useState } from "react"
import { Check, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import useNextPWAOnboardingStep from "../../hooks/useNextPWAOnboardingStep"
import PatientPageWrapper from "../PatientPageWrapper"

const STEP_ID = "03"

export default function LocationAccessPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isRequesting, setIsRequesting] = useState(false)

  const nextStep = useNextPWAOnboardingStep()

  const handleNext = () => {
    if (nextStep) {
      navigate(nextStep)
    } else {
      navigate("/patients")
    }
  }

  const handleSkip = () => {
    // Record skip, but step remains incomplete in status check
    localStorage.setItem(`pwa_skip_${STEP_ID}`, "true")
    handleNext()
  }

  const handleEnable = () => {
    setIsRequesting(true)
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      })
      setIsRequesting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (_position) => {
        // Success
        setIsRequesting(false)
        handleNext()
      },
      (error) => {
        console.error(error)
        setIsRequesting(false)
        toast({
          title: "Location Access Denied",
          description: "Please allow location access in your browser settings.",
          variant: "destructive",
        })
      }
    )
  }

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle="Find care near you"
      description="Enable location to instantly see verified hospitals and pharmacies in your area."
      footer={
        <div className="border-t bg-white p-4">
          <div className="flex gap-4">
            <Button className="w-1/3 " variant="secondary" onClick={handleSkip}>
              Skip
            </Button>
            <Button
              className="w-2/3"
              size="lg"
              onClick={handleEnable}
              disabled={isRequesting}
            >
              {isRequesting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isRequesting ? (
                "Requesting..."
              ) : (
                <>
                  {" "}
                  <MapPin className="w-4 h-4 mr-2" /> Use my location
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full">
        <p className="text-neutral-500 text-sm mb-4">Why?</p>

        <div className="space-y-4 bg-white rounded-xl">
          <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-lg">
            <Check className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-900">Find hospitals near you</span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-lg">
            <Check className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-900">
              Get notified of nearby offers
            </span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-lg">
            <Check className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-900">
              Save your care provider preferences for your next visit
            </span>
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
