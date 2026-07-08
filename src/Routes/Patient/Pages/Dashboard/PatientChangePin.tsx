import { useState } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import { DualActionFooter } from "@/Routes/shell/footers"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/InputOtp"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import pinProtectIcon from "@/assets/icons/pin-protect.svg"

export default function PatientChangePin() {
  const [step, setStep] = useState(1)
  const [oldPin, setOldPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")

  const { toast } = useToast()
  const navigate = useNavigate()

  const { isPending, isSuccess, mutateAsync } = useMutation({
    mutationFn: async (data: { oldPin: string; newPin: string }) => {
      const result = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/change-pin`,
        {
          oldPin: data.oldPin,
          newPin: data.newPin,
        }
      )

      return result.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PIN changed successfully",
      })
      navigate("/patients/security-and-permissions")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const handleOldPinComplete = (value: string) => {
    setOldPin(value)
    setError("")
  }

  const handleOldPinNext = () => {
    if (oldPin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }
    setError("")
    setStep(2)
  }

  const handleNewPinComplete = (value: string) => {
    setNewPin(value)
    setError("")
  }

  const handleNewPinNext = () => {
    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }
    if (newPin.length > 8) {
      setError("PIN must be at most 8 digits")
      return
    }
    if (newPin === oldPin) {
      setError("New PIN must be different from old PIN")
      return
    }
    setError("")
    setStep(3)
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
    if (confirmPin !== newPin) {
      setError("PINs do not match. Please try again.")
      return
    }
    setError("")
    await mutateAsync({ oldPin, newPin })
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setNewPin("")
    } else if (step === 3) {
      setStep(2)
      setConfirmPin("")
    }
    setError("")
  }

  // Header back: step 1 exits the flow, later steps go back a step.
  const handleHeaderBack = () => {
    if (step === 1) {
      navigate("/patients/security-and-permissions")
    } else {
      handleBack()
    }
  }

  // Footer actions are driven by the current step.
  const footerConfig =
    {
      1: {
        primary: {
          label: "Continue",
          onClick: handleOldPinNext,
          disabled: oldPin.length < 4,
        },
        secondary: {
          label: "Cancel",
          onClick: () => navigate("/patients/security-and-permissions"),
        },
      },
      2: {
        primary: {
          label: "Save PIN",
          onClick: handleNewPinNext,
          disabled: newPin.length < 4,
        },
        secondary: { label: "Back", onClick: handleBack },
      },
      3: {
        primary: {
          label: "Confirm",
          onClick: handleSubmit,
          isLoading: isPending,
          disabled: isPending || isSuccess || confirmPin.length < 4,
        },
        secondary: {
          label: "Back",
          onClick: handleBack,
          disabled: isPending || isSuccess,
        },
      },
    }[step] ?? null

  return (
    <PatientPageWrapper
      title="Change PIN"
      onBack={handleHeaderBack}
      footer={
        footerConfig ? (
          <DualActionFooter
            primary={footerConfig.primary}
            secondary={footerConfig.secondary}
          />
        ) : null
      }
    >
      <div className="flex flex-col gap-5">
        {step === 1 && (
          <>
            <img
              src={pinProtectIcon}
              alt="Pin protect icon"
              className="w-32 h-32 mx-auto"
            />
            <h1 className="text-center">Enter your current PIN</h1>
            <p className="text-center text-muted-foreground">
              Please enter your current PIN to continue.
            </p>

            <div className="flex flex-col gap-2 items-center">
              <InputOTP
                maxLength={4}
                value={oldPin}
                onChange={handleOldPinComplete}
                id="oldPin"
                type="password"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <p className="flex gap-2 mt-2 justify-center">
              Forgot your PIN?
              <a href="tel:+254117118511" className="">
                Call Jireh Support
              </a>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <img
              src={pinProtectIcon}
              alt="Pin protect icon"
              className="w-32 h-32 mx-auto"
            />
            <h1 className="text-center">Create your new PIN</h1>
            <p className="text-center text-muted-foreground">
              You will use this PIN to confirm all payments.
            </p>

            <div className="flex flex-col gap-2 items-center">
              <InputOTP
                maxLength={4}
                value={newPin}
                onChange={handleNewPinComplete}
                id="newPin"
                type="password"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <img
              src={pinProtectIcon}
              alt="Pin protect icon"
              className="w-32 h-32 mx-auto"
            />

            <h1 className="text-center">Confirm your new PIN</h1>
            <p className="text-center text-muted-foreground">
              Enter the new PIN you just created.
            </p>

            <div className="flex flex-col gap-2 items-center">
              <InputOTP
                maxLength={4}
                value={confirmPin}
                onChange={handleConfirmPinComplete}
                id="confirmPin"
                type="password"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </>
        )}
      </div>
    </PatientPageWrapper>
  )
}
