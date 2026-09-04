import { useState, useEffect } from "react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/InputOtp"
import { useMutation } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { Button } from "@/components/Button"
import ErrorMessage from "@/components/ErrorMessage"

export default function CreateAccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, phoneDisplay } = (location.state ?? {}) as {
    phone?: string
    phoneDisplay?: string
  }
  const setSupabaseSession = usePatientAuthStore(
    (state) => state.setSupabaseSession,
  )

  const [step, setStep] = useState<"create" | "confirm">("create")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [mismatchError, setMismatchError] = useState("")

  useEffect(() => {
    if (!phone) {
      navigate("/patients/auth", { replace: true })
    }
  }, [phone, navigate])

  const signUpMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signUp({
        phone: phone!,
        password: confirmPin,
      })

      if (error) throw error

      if (!data.session) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            phone: phone!,
            password: confirmPin,
          })

        if (signInError) throw signInError
        if (signInData.session) {
          setSupabaseSession(signInData.session)
        }

        return signInData
      }

      setSupabaseSession(data.session)
      return data
    },
    onSuccess: () => {
      navigate("/patients/auth/sign-up-details", {
        state: { phone, phoneDisplay },
        replace: true,
      })
    },
  })

  const handlePinSet = () => {
    if (pin.length !== 6) return
    setMismatchError("")
    setStep("confirm")
  }

  const handleConfirm = () => {
    if (confirmPin.length !== 6) return
    if (confirmPin !== pin) {
      setMismatchError("PINs do not match. Please try again.")
      setConfirmPin("")
      return
    }
    setMismatchError("")
    signUpMutation.mutate()
  }

  const handleBack = () => {
    if (step === "confirm") {
      setStep("create")
      setConfirmPin("")
      setMismatchError("")
    } else {
      navigate("/patients/auth", { replace: true })
    }
  }

  if (!phone) return null

  const isCreateStep = step === "create"
  const error = mismatchError || (signUpMutation.isError ? signUpMutation.error.message : "")

  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label={isCreateStep ? "Continue" : "Create Account"}
          type="button"
          onClick={isCreateStep ? handlePinSet : handleConfirm}
          disabled={
            isCreateStep
              ? pin.length !== 6
              : confirmPin.length !== 6 || signUpMutation.isPending
          }
          isLoading={signUpMutation.isPending}
        />
      }
      className="items-center gap-6"
    >
      <div className="text-center space-y-2">
        <h1>{isCreateStep ? "Create a login PIN" : "Confirm your PIN"}</h1>
        <p className="text-muted-foreground text-center">
          {isCreateStep
            ? "Choose a 6-digit PIN to secure your account."
            : "Re-enter your PIN to confirm."}
          <br />({phoneDisplay ?? phone})
        </p>
        <Button
          variant="link"
          type="button"
          className="h-auto"
          onClick={handleBack}
        >
          {isCreateStep ? "Change phone number" : "Go back"}
        </Button>
      </div>

      <InputOTP
        key={step}
        autoFocus
        maxLength={6}
        id={isCreateStep ? "createPin" : "confirmPin"}
        value={isCreateStep ? pin : confirmPin}
        onChange={(val) => {
          if (isCreateStep) {
            setPin(val)
          } else {
            setConfirmPin(val)
            setMismatchError("")
          }
        }}
        disabled={signUpMutation.isPending}
        type="password"
        className="sensitive-data"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} className="h-12 w-12" />
          <InputOTPSlot index={1} className="h-12 w-12" />
          <InputOTPSlot index={2} className="h-12 w-12" />
        </InputOTPGroup>
        <div className="mx-2 flex items-center font-bold text-xl">&bull;</div>
        <InputOTPGroup>
          <InputOTPSlot index={3} className="h-12 w-12" />
          <InputOTPSlot index={4} className="h-12 w-12" />
          <InputOTPSlot index={5} className="h-12 w-12" />
        </InputOTPGroup>
      </InputOTP>

      {error && <ErrorMessage message={error} />}
    </PatientAuthWrapper>
  )
}
