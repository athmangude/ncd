import PatientAuthWrapper from "@/Routes/Patient/components/PatientAuthWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { useState, useEffect } from "react"
import VerifyOTPForm from "../components/VerifyOTPForm"
import { useForm } from "react-hook-form"
import PatientAuthHeadline from "../components/PatientAuthHeadline"
import FormGroup from "@/components/form/FormGroupInput"
import { Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { createCode } from "supertokens-auth-react/recipe/passwordless"
import { CountryCode, parsePhoneNumber } from "libphonenumber-js"
import { toast } from "@/hooks/useToast"
import { validatePhoneNumber } from "@/utilities/validators"
import { trackEvent, EVENTS, maskPhoneNumber } from "@/analytics"

export default function PatientLogIn() {
  const [showOtpPage, setShowOtpPage] = useState(false)

  // Both branches self-shell (LogInForm via PatientAuthWrapper, VerifyOTPForm via
  // its own MobileWrapper), so this is a pure switch — wrapping either here would
  // nest a second AppShell.
  return !showOtpPage ? (
    <LogInForm setShowOtpPage={setShowOtpPage} />
  ) : (
    <VerifyOTPForm />
  )
}

type Inputs = {
  phoneNumber: string
  countryCode: CountryCode
}

function LogInForm({ setShowOtpPage }: { setShowOtpPage: Function }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      countryCode: "KE",
    },
  })

  const currentCountryCode = watch("countryCode")

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.SIGNIN.PHONE_ENTRY_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const phoneNumber = parsePhoneNumber(data.phoneNumber, data.countryCode)

      const response = await createCode({
        phoneNumber: phoneNumber.number,
      })

      if (response.status === "SIGN_IN_UP_NOT_ALLOWED") {
        // the reason string is a user friendly message
        // about what went wrong. It can also contain a support code which users
        // can tell you so you know why their sign in / up was not allowed.
        throw new Error(response.reason)
      }

      try {
        trackEvent(EVENTS.SIGNIN.PHONE_ENTRY_SUBMIT, {
          maskedPhoneNumber: maskPhoneNumber(data.phoneNumber),
          countryCode: data.countryCode,
        })
      } catch {
        // Silent fail
      }

      setShowOtpPage(true)

      return true
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })
  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label="Send OTP"
          form="patient-login-form"
          type="submit"
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
        />
      }
    >
      <form
        id="patient-login-form"
        className="flex flex-col gap-7"
        onSubmit={handleSubmit(async (data) => {
          await mutation.mutate(data)
        })}
      >
        <PatientAuthHeadline text="Please type in your phone number" />

        <input type="hidden" {...register("countryCode")} />

        <FormGroup
          id="phoneNumber"
          label="Phone Number"
          type="phone"
          placeholder="Enter your phone number"
          register={register("phoneNumber", {
            required: {
              value: true,
              message: "Please enter your phone number",
            },
            validate: (value) => {
              if (
                !validatePhoneNumber({
                  countryCode: watch("countryCode"),
                  phoneNumber: value,
                })
              ) {
                return "Please enter a valid phone number"
              }

              return true
            },
          })}
          error={errors.phoneNumber?.message}
          countryCode={currentCountryCode}
          onCountryCodeChange={(code) => setValue("countryCode", code)}
          isDevMode={
            import.meta.env.DEV ||
            import.meta.env.VITE_NODE_ENV === "development"
          }
        />

        <Link to="/patients/auth" className="font-bold  mx-auto">
          Sign Up
        </Link>
      </form>
    </PatientAuthWrapper>
  )
}
