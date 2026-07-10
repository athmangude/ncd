import FormGroup from "@/components/form/FormGroupInput"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { trackEvent, EVENTS, maskPhoneNumber } from "@/analytics"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createCode } from "supertokens-auth-react/recipe/passwordless"
import { CountryCode, parsePhoneNumber } from "libphonenumber-js"
import {
  validateCountryCode,
  validatePhoneNumber,
} from "@/utilities/validators"
import { useToast } from "@/hooks/useToast"
import { Checkbox } from "@/components/Checkbox"
import axios from "axios"
import ErrorBlock from "@/components/ErrorBlock"
import LoadingPage from "@/Routes/LoadingPage"
import { Card } from "@/components/Card"
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/utilities/localStorage"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

export type Inputs = {
  phoneNumber: string
  countryCode: CountryCode
  whatsappPhoneNumber: string
  whatsappCountryCode: CountryCode
}

export default function PatientSignUp() {
  return <SignUpForm />
}

export const countryCodesQueryKey = "getCountryCodes"
const PHONE_NUMBER_STORAGE_KEY = "approved_patient_phone_number"

function SignUpForm() {
  const query = useQuery({
    queryKey: [countryCodesQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/country-codes`
      )

      return response.data
    },
  })

  const { toast } = useToast()

  const savedData = getFromLocalStorage(PHONE_NUMBER_STORAGE_KEY)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    mode: "onBlur",
    defaultValues: {
      countryCode: savedData?.countryCode || "KE",
      phoneNumber: savedData?.phoneNumber || "",
    },
  })

  const currentCountryCode = watch("countryCode")

  const [hasAgreedToPrivacyPolicy, setHasAgreedToPrivacyPolicy] =
    useState(false)

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.SIGNUP.PHONE_ENTRY_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const navigate = useNavigate()

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

      return data
    },

    onSuccess: (data) => {
      try {
        trackEvent(EVENTS.SIGNUP.PHONE_ENTRY_SUBMIT, {
          maskedPhoneNumber: maskPhoneNumber(data.phoneNumber),
          countryCode: data.countryCode,
          hasAcceptedPrivacyPolicy: true,
        })
      } catch {
        // Silent fail
      }
      setToLocalStorage(PHONE_NUMBER_STORAGE_KEY, {
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode,
      })
      navigate("/patients/auth/otp", {
        state: {
          phoneNumber: data.phoneNumber,
        },
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label="Send OTP"
          type="submit"
          form="patient-signup-form"
          disabled={mutation.isPending || !hasAgreedToPrivacyPolicy}
          isLoading={mutation.isPending}
        />
      }
    >
      <form
        id="patient-signup-form"
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(async (data) => {
            await mutation.mutateAsync(data)
          })(e)
        }}
      >
        <div className="flex flex-col gap-2">
          <PatientAuthHeadline text="Enter your phone number" />
          <p className="text-muted-foreground text-center">
            We'll send you an SMS with a code.
          </p>
        </div>

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
                import.meta.env.VITE_NODE_ENV !== "development" &&
                !validateCountryCode({
                  countryCode: watch("countryCode"),
                  phoneNumber: value,
                })
              ) {
                return "Unfortunately, we only support phone numbers from Kenya at the moment"
              }

              if (
                import.meta.env.VITE_NODE_ENV !== "development" &&
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

        <Card className="p-3">
          <div className="flex space-x-2">
            <Checkbox
              id="has agreed to privacy policy"
              checked={hasAgreedToPrivacyPolicy}
              onCheckedChange={() =>
                setHasAgreedToPrivacyPolicy(!hasAgreedToPrivacyPolicy)
              }
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <span className="font-medium text-foreground">
                I agree to Jireh's Privacy Policy
              </span>
              <br />
              <span>
                By ticking this box, you confirm that you have read and agreed
                to our{" "}
                <a
                  href="https://jireh-health.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy →
                </a>
              </span>
            </label>
          </div>
        </Card>
      </form>
    </PatientAuthWrapper>
  )
}
