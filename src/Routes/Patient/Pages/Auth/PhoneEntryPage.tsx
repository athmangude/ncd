import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import FormGroup from "@/components/form/FormGroupInput"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { CountryCode, parsePhoneNumber } from "libphonenumber-js"
import { validatePhoneNumber } from "@/utilities/validators"
import { useToast } from "@/hooks/useToast"

type Inputs = {
  phoneNumber: string
  countryCode: CountryCode
}

export default function PhoneEntryPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

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

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const parsed = parsePhoneNumber(data.phoneNumber, data.countryCode)
      const phone = parsed.number

      const { error } = await supabase.auth.signInWithOtp({ phone })

      if (error) throw error

      navigate("/patients/auth/otp", {
        state: { phone, phoneDisplay: parsed.formatInternational() },
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label="Send OTP"
          form="supabase-phone-entry"
          type="submit"
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
        />
      }
    >
      <form
        id="supabase-phone-entry"
        className="flex flex-col gap-7"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
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
      </form>
    </PatientAuthWrapper>
  )
}
