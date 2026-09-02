import { Button } from "@/components/Button"
import ErrorMessage from "@/components/ErrorMessage"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/InputOtp"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, phoneDisplay } = (location.state ?? {}) as {
    phone?: string
    phoneDisplay?: string
  }
  const setSupabaseSession = usePatientAuthStore(
    (state) => state.setSupabaseSession,
  )

  const [otp, setOtp] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(60)

  useEffect(() => {
    if (!phone) {
      navigate("/patients/auth", { replace: true })
    }
  }, [phone, navigate])

  useEffect(() => {
    if (!phone) return

    supabase.functions
      .invoke("get-otp", { body: { phone } })
      .then(({ data }) => {
        if (data?.otp) {
          const otpStr = String(data.otp)
          setOtp(otpStr)
          verifyMutation.mutate(otpStr)
        }
      })
      .catch(() => {
        // Auto-fill failed — user can enter manually
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone])

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const verifyMutation = useMutation({
    mutationFn: async (codeOverride?: string) => {
      const token = typeof codeOverride === "string" ? codeOverride : otp

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone!,
        token,
        type: "sms",
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
      setOtp("")
    },
  })

  const resendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone!,
      })
      if (error) throw error
      setSecondsLeft(60)
      return "OTP resent, please check your messages."
    },
  })

  if (!phone) return null

  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label="Verify OTP"
          type="button"
          onClick={() => verifyMutation.mutate(undefined)}
          disabled={otp.length !== 6 || verifyMutation.isPending}
          isLoading={verifyMutation.isPending}
        />
      }
      className="items-center gap-6"
    >
      <div className="text-center space-y-2">
        <h1>Enter your One-Time-PIN</h1>
        <p className="text-muted-foreground text-center">
          We sent an SMS to your phone number <br />({phoneDisplay ?? phone}).
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
        id="supabaseOTP"
        value={otp}
        onChange={(e) => {
          setOtp(e)
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

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Didn&apos;t receive a code?
        </p>
        {secondsLeft === 0 ? (
          <Button
            variant="secondary"
            className="mt-2"
            type="button"
            disabled={verifyMutation.isPending || resendMutation.isPending}
            onClick={(event) => {
              event.preventDefault()
              resendMutation.mutate()
            }}
          >
            Resend OTP
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend OTP in{" "}
            <span className="text-primary font-medium">
              {secondsLeft.toString().padStart(2, "0")}
            </span>{" "}
            seconds
          </p>
        )}
      </div>

      {verifyMutation.isError && (
        <ErrorMessage message={verifyMutation.error.message} />
      )}
      {resendMutation.isError && (
        <ErrorMessage message={resendMutation.error.message} />
      )}
    </PatientAuthWrapper>
  )
}
