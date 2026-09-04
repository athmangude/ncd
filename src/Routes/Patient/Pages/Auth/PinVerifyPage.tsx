import ErrorMessage from "@/components/ErrorMessage"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/InputOtp"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { Button } from "@/components/Button"

export default function PinVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, phoneDisplay } = (location.state ?? {}) as {
    phone?: string
    phoneDisplay?: string
  }
  const setSupabaseSession = usePatientAuthStore(
    (state) => state.setSupabaseSession,
  )

  const [pin, setPin] = useState("")

  useEffect(() => {
    if (!phone) {
      navigate("/patients/auth", { replace: true })
    }
  }, [phone, navigate])

  const verifyMutation = useMutation({
    mutationFn: async (pinOverride?: string) => {
      const password = typeof pinOverride === "string" ? pinOverride : pin

      const { data, error } = await supabase.auth.signInWithPassword({
        phone: phone!,
        password,
      })

      if (error) throw error

      if (data.session) {
        setSupabaseSession(data.session)
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user!.id)
        .maybeSingle()

      if (profile) {
        navigate("/patients/", { replace: true })
      } else {
        navigate("/patients/companion/intake", { replace: true })
      }

      return data
    },
    onError: () => {
      setPin("")
    },
  })

  if (!phone) return null

  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label="Verify PIN"
          type="button"
          onClick={() => verifyMutation.mutate(undefined)}
          disabled={pin.length !== 6 || verifyMutation.isPending}
          isLoading={verifyMutation.isPending}
        />
      }
      className="items-center gap-6"
    >
      <div className="text-center space-y-2">
        <h1>Enter your PIN</h1>
        <p className="text-muted-foreground text-center">
          Enter the 6-digit PIN for your account
          <br />({phoneDisplay ?? phone}).
        </p>
        <Button
          variant="link"
          type="button"
          className="h-auto"
          onClick={() => navigate("/patients/auth", { replace: true })}
        >
          Change phone number
        </Button>
      </div>

      <InputOTP
        autoFocus
        maxLength={6}
        id="supabasePIN"
        value={pin}
        onChange={(e) => {
          setPin(e)
          if (e.length === 6) {
            verifyMutation.mutate(e)
          }
        }}
        disabled={verifyMutation.isPending}
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

      {verifyMutation.isError && (
        <ErrorMessage message={verifyMutation.error.message} />
      )}
    </PatientAuthWrapper>
  )
}
