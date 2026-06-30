import { useState, useEffect } from "react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/InputOtp"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { patientLoginDetailsQueryKey } from "../../hooks/useOnboardingChecklist"
import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { trackEvent, EVENTS } from "@/analytics"

export default function PatientSetPin() {
  const [step, setStep] = useState(1)
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")

  const { toast } = useToast()

  const next = useNextOnboardingStep()

  const location = useLocation()
  const state = location.state

  const fromDashboardUrl = state?.fromDashboard && "/patients"

  const redirectUrl = state?.redirectUrl || fromDashboardUrl || next

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.SIGNUP.SET_PIN_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const { isPending, isSuccess, mutateAsync } = useMutation({
    mutationFn: async (pinValue: string) => {
      const result = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/set-pin`,
        {
          pin: pinValue,
        }
      )

      return result.data
    },
    onSuccess: async () => {
      try {
        trackEvent(EVENTS.SIGNUP.SET_PIN_SUBMIT)
      } catch {
        // Silent fail
      }
      toast({
        title: "Success",
        description: "PIN set successfully",
      })

      await queryClient.invalidateQueries({
        queryKey: [patientLoginDetailsQueryKey],
      })

      navigate(redirectUrl)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const handlePinComplete = (value: string) => {
    setPin(value)
    setError("")
  }

  const handleNextStep = () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }
    if (pin.length > 8) {
      setError("PIN must be at most 8 digits")
      return
    }
    setError("")
    setStep(2)
  }

  const handleConfirmPinComplete = (value: string) => {
    setConfirmPin(value)
    setError("")
  }

  const handleSubmit = async () => {
    if (confirmPin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }
    if (confirmPin !== pin) {
      setError("PINs do not match. Please try again.")
      return
    }
    setError("")
    await mutateAsync(pin)
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setPin("")
      setConfirmPin("")
      setError("")
    } else {
      navigate(-1)
    }
  }

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title={step === 1 ? "Create your PIN" : "Confirm your PIN"}
          onBack={handleBack}
        />
      }
      footer={
        <PrimaryCTAFooter
          label={step === 1 ? "Save PIN" : "Confirm"}
          onClick={step === 1 ? handleNextStep : handleSubmit}
          isLoading={isPending}
          disabled={
            step === 1
              ? pin.length < 4
              : isPending || isSuccess || confirmPin.length < 4
          }
        />
      }
      className="flex flex-col items-center"
    >
      <div className="text-center">
        <h1>{step === 1 ? "Create your PIN" : "Confirm your PIN"}</h1>
        <p className="text-neutral-500 text-sm leading-relaxed px-4">
          {step === 1
            ? "You will use this PIN to confirm all payments."
            : "Enter the PIN you just created."}
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-8 m-8">
        <div className="flex flex-col gap-2 items-center w-full">
          <InputOTP
            maxLength={4}
            value={step === 1 ? pin : confirmPin}
            onChange={step === 1 ? handlePinComplete : handleConfirmPinComplete}
            id={step === 1 ? "pin" : "confirmPin"}
            type="password"
          >
            <InputOTPGroup className="gap-0 bg-white shadow-sm">
              <InputOTPSlot
                index={0}
                className="h-14 w-14 border-y border-l text-xl"
              />
              <InputOTPSlot
                index={1}
                className="h-14 w-14 border-y border-l text-xl"
              />
              <InputOTPSlot
                index={2}
                className="h-14 w-14 border-y border-l text-xl"
              />
              <InputOTPSlot index={3} className="h-14 w-14 border text-xl" />
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>
      </div>
    </MobileWrapper>
  )
}
