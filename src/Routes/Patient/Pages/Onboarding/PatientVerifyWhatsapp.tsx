import { Button } from "@/components/Button"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import axios, { HttpStatusCode } from "axios"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { ReloadIcon } from "@radix-ui/react-icons"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/InputOtp"
import { useToast } from "@/hooks/useToast"
import { useNavigate } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import { validatePhoneNumber } from "@/utilities/validators"
import FormGroupInput from "@/components/form/FormGroupInput"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { countryCodesQueryKey } from "./PatientSignUp"
import { CountryCode, parsePhoneNumber } from "libphonenumber-js"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"

export const verifyOtpQueryKey = "verifyOtp"
type WhatsappNumberState = "NOT_SET" | "SET_THROUGH_SIGNUP" | "SET_THROUGH_FORM"
export default function PatientVerifyWhatsapp() {
  const navigate = useNavigate()

  const user = usePatientAuthStore((state: any) => state.signUpDetails)

  const [whatsappNumberState, setWhatsappNumberState] =
    useState<WhatsappNumberState>(
      user?.whatsappNumber ? "SET_THROUGH_SIGNUP" : "NOT_SET"
    )

  async function generateOtp(
    whatsappPhoneNumber: string,
    whatsappCountryCode: string
  ) {
    const response = await axios.post(
      `${
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
      }/patients/generate-whatsapp-otp`,
      {
        whatsappPhoneNumber: whatsappPhoneNumber,
        whatsappCountryCode: whatsappCountryCode,
      }
    )
    if (response.status === HttpStatusCode.Accepted) {
      navigate("/patients")
    }
  }

  return (
    <PatientAuthWrapper>
      {whatsappNumberState === "NOT_SET" ? (
        <GenerateOtpForm
          generateOtp={generateOtp}
          setWhatsappNumberState={setWhatsappNumberState}
        />
      ) : (
        <VerifyOTPForm
          whatsappNumberState={whatsappNumberState}
          setWhatsappNumberState={setWhatsappNumberState}
          generateOtp={generateOtp}
        />
      )}
    </PatientAuthWrapper>
  )
}

type Inputs = {
  whatsappPhoneNumber: string
  whatsappCountryCode: CountryCode
}

function GenerateOtpForm({
  generateOtp,
  setWhatsappNumberState,
}: {
  generateOtp: (
    whatsappPhoneNumber: string,
    whatsappCountryCode: CountryCode
  ) => void
  setWhatsappNumberState: (state: WhatsappNumberState) => void
}) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<Inputs>()

  const query = useQuery({
    queryKey: [countryCodesQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/country-codes`
      )

      return response.data
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const phoneNumber = parsePhoneNumber(
        data.whatsappPhoneNumber,
        data.whatsappCountryCode
      )
      await generateOtp(phoneNumber.number, data.whatsappCountryCode)

      setWhatsappNumberState("SET_THROUGH_FORM")
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
    <form
      className="flex flex-col gap-7"
      onSubmit={handleSubmit(async (data) => {
        await mutation.mutateAsync(data)
      })}
    >
      <PatientAuthHeadline text="Input your WhatsApp number" />

      <Controller
        name="whatsappCountryCode"
        control={control}
        rules={{
          required: {
            value: true,
            message: "Please select your country",
          },
        }}
        render={({ field }) => (
          <FormGroupSelect
            id="whatsappCountryCode"
            label="WhatsApp Country Code"
            placeholder="Select Country Code"
            field={field}
            error={errors.whatsappCountryCode?.message}
            options={query.data.countryOptions}
          />
        )}
      />
      <FormGroupInput
        id="whatsappPhoneNumber"
        label="Whatsapp Number"
        type="text"
        placeholder="Enter your Whatsapp number"
        register={register("whatsappPhoneNumber", {
          validate: (value) => {
            if (
              !validatePhoneNumber({
                countryCode: watch("whatsappCountryCode"),
                phoneNumber: value,
              })
            ) {
              return "Please enter a valid phone number"
            }

            return true
          },
        })}
        error={errors.whatsappPhoneNumber?.message}
      />

      <Button
        className="w-full"
        size="lg"
        role="link"
        type="submit"
        disabled={mutation.isPending}
        isLoading={mutation.isPending}
      >
        Generate OTP
      </Button>
    </form>
  )
}

function VerifyOTPForm({
  whatsappNumberState,
  setWhatsappNumberState,
  generateOtp,
}: {
  whatsappNumberState: WhatsappNumberState
  setWhatsappNumberState: (state: WhatsappNumberState) => void
  generateOtp: (
    whatsappPhoneNumber: string,
    whatsappCountryCode: string
  ) => void
}) {
  const navigate = useNavigate()
  const nextStep = useNextOnboardingStep()

  const { toast } = useToast()

  const user = usePatientAuthStore((state: any) => state.signUpDetails)

  const query = useQuery({
    queryKey: [verifyOtpQueryKey],
    queryFn: async () => {
      if (
        whatsappNumberState === "SET_THROUGH_SIGNUP" &&
        user?.whatsappNumber &&
        user?.whatsappCountryCode
      ) {
        await generateOtp(user?.whatsappNumber, user?.whatsappCountryCode)
      }

      return true
    },
    // Prevent duplicate requests
    enabled: whatsappNumberState === "SET_THROUGH_SIGNUP",
    staleTime: Infinity,
  })

  const [otp, setOtp] = useState("")

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/verify-whatsapp-otp`,
        {
          whatsappOtpCode: otp,
        }
      )

      navigate(nextStep)

      return response.data
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
    <>
      <h1 className="text-xl font-bold">We've sent you a WhatsApp message</h1>

      <p>
        Enter the code we've sent by text to your WhatsApp number.{" "}
        <Button
          variant="link"
          onClick={() => {
            setWhatsappNumberState("NOT_SET")
          }}
        >
          Change Phone Number.
        </Button>
      </p>

      <form>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="patientOTP"
            className="font-medium flex gap-2 items-center"
          >
            Enter code
            {mutation.isPending && (
              <ReloadIcon className="animate-spin h-4 w-4 text-foreground" />
            )}
          </label>
          <InputOTP
            maxLength={6}
            id="patientOTP"
            value={otp}
            onChange={(e) => {
              setOtp(e)
            }}
            disabled={mutation.isPending}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <Button
            className="mt-5"
            onClick={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
            disabled={otp.length !== 6 || mutation.isPending}
            isLoading={mutation.isPending}
          >
            Submit OTP
          </Button>
        </div>

        <p className="text-sm">
          Didn't get the WhatsApp message?{" "}
          <Button
            variant="link"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate()
            }}
          >
            Send Again
          </Button>
        </p>
      </form>
    </>
  )
}
