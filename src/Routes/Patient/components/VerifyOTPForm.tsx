import * as amplitude from "@amplitude/analytics-browser"
import { Button } from "@/components/Button"
import ErrorMessage from "@/components/ErrorMessage"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/InputOtp"
import SuccessMessage from "@/components/SuccessMessage"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  clearLoginAttemptInfo,
  consumeCode,
  resendCode,
} from "supertokens-auth-react/recipe/passwordless"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import useNextOnboardingStep from "../hooks/useNextOnboardingStep"
import { useWebOTP } from "../hooks/useWebOTP"
import { trackEvent, EVENTS } from "@/analytics"
import MobileWrapper, {
  LogoHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"

export default function VerifyOTPForm() {
  const navigate = useNavigate()
  const setUserId = usePatientAuthStore((state: any) => state.setUserId)

  const [otp, setOtp] = useState("")
  const { code } = useWebOTP()

  const nextStep = useNextOnboardingStep()

  const [secondsLeft, setSecondsLeft] = useState(60)

  const location = useLocation()
  const data = location.state
  const isSignUp = data?.isSignUp !== false // Default to signup if not specified

  // Track OTP view on mount
  useEffect(() => {
    try {
      const viewEvent = isSignUp
        ? EVENTS.SIGNUP.OTP_VIEW
        : EVENTS.SIGNIN.OTP_VIEW
      trackEvent(viewEvent)
    } catch {
      // Silent fail
    }
  }, [isSignUp])

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
    onError: (error: Error) => {
      setOtp("")
      try {
        const errorEvent = isSignUp
          ? EVENTS.SIGNUP.OTP_ERROR
          : EVENTS.SIGNIN.OTP_ERROR
        trackEvent(errorEvent, { errorMessage: error?.message })
      } catch {
        // Silent fail
      }
    },
    mutationFn: async (codeOverride?: string) => {
      const response = await consumeCode({
        userInputCode: typeof codeOverride === "string" ? codeOverride : otp,
      })

      if (response.status === "OK") {
        // Track OTP success
        try {
          const successEvent = isSignUp
            ? EVENTS.SIGNUP.OTP_SUCCESS
            : EVENTS.SIGNIN.OTP_SUCCESS
          trackEvent(successEvent, { isNewUser: response.createdNewRecipeUser })
        } catch {
          // Silent fail
        }
        // we clear the login attempt info that was added when the createCode function
        // was called since the login was successful.
        await clearLoginAttemptInfo()
        setUserId(
          response.user.id,
          import.meta.env.AMPLITUDE_API_KEY,
          Date.now().toString()
        ) // TODO: move token out
        if (
          response.createdNewRecipeUser &&
          response.user.loginMethods.length === 1
        ) {
          // user sign up success
          navigate(nextStep)
          return response.user
        } else {
          // user sign in success
          amplitude.setUserId(response.user.id)
          navigate("/patients/")
          return response.user
        }
      } else if (response.status === "INCORRECT_USER_INPUT_CODE_ERROR") {
        // the user entered an invalid OTP
        throw new Error(
          "Wrong OTP! Please try again. Number of attempts left: " +
            (response.maximumCodeInputAttempts -
              response.failedCodeInputAttemptCount)
        )
      } else if (response.status === "EXPIRED_USER_INPUT_CODE_ERROR") {
        // it can come here if the entered OTP was correct, but has expired because
        // it was generated too long ago.
        throw new Error(
          "Old OTP entered. Please regenerate a new one and try again"
        )
      } else {
        // this can happen if the user tried an incorrect OTP too many times.
        // or if it was denied due to security reasons in case of automatic account linking

        // we clear the login attempt info that was added when the createCode function
        // was called - so that if the user does a page reload, they will now see the
        // enter email / phone UI again.
        await clearLoginAttemptInfo()
        navigate("/patients/auth")

        throw new Error("Login failed. Please try again")
      }
    },
  })

  useEffect(() => {
    if (code) {
      setOtp(code)
      verifyMutation.mutate(code)
    }
    // Triggered on code change; depend on the stable .mutate fn rather than the mutation object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, verifyMutation.mutate])

  const resendMutation = useMutation({
    mutationFn: async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      try {
        const resendEvent = isSignUp
          ? EVENTS.SIGNUP.OTP_RESEND
          : EVENTS.SIGNIN.OTP_RESEND
        trackEvent(resendEvent)
      } catch {
        // Silent fail
      }
      const response = await resendCode()

      if (response.status === "RESTART_FLOW_ERROR") {
        // this can happen if the user has already successfully logged in into
        // another device whilst also trying to login to this one.

        // we clear the login attempt info that was added when the createCode function
        // was called - so that if the user does a page reload, they will now see the
        // enter email / phone UI again.
        await clearLoginAttemptInfo()
        throw new Error("Login failed. Please try again")
      }

      return "OTP resent, please check your messages."
    },
  })

  return (
    <MobileWrapper
      header={<LogoHeader showIcons={false} className="flex justify-center" />}
      footer={
        <PrimaryCTAFooter
          label="Submit OTP"
          type="button"
          onClick={() => verifyMutation.mutate(undefined)}
          disabled={otp.length !== 6 || verifyMutation.isPending}
          isLoading={verifyMutation.isPending}
        />
      }
      className="flex flex-col items-center gap-6"
    >
      <div className="text-center space-y-2">
        <h1>Enter your One-Time-PIN</h1>
        <p className="text-muted-foreground text-center">
          We sent an SMS to your phone number <br />({data.phoneNumber}).
        </p>
        <Button
          variant="link"
          type="button"
          className="h-auto"
          onClick={async (e) => {
            e.preventDefault()
            await clearLoginAttemptInfo()
            navigate("/patients/auth")
          }}
        >
          Change phone number
        </Button>
      </div>

      <InputOTP
        maxLength={6}
        id="patientOTP"
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
        <div className="mx-2 flex items-center font-bold text-xl">•</div>
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
              resendMutation.mutate(event)
              setSecondsLeft(60)
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
      {resendMutation.data && <SuccessMessage message={resendMutation.data} />}
    </MobileWrapper>
  )
}
