import FormGroupInput from "@/components/form/FormGroupInput"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { CountryCode } from "libphonenumber-js"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/useToast"
import {
  validateCountryCode,
  validatePhoneNumber,
} from "@/utilities/validators"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { patientLoginDetailsQueryKey } from "../PatientsHome"
import { Checkbox } from "@/components/Checkbox"
import { useState } from "react"

export type Inputs = {
  whatsappPhoneNumber: string
  whatsappCountryCode: CountryCode
}

export default function PatientAddWhatsAppNumber() {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Inputs>()

  const [isSameAsPhoneNumber, setIsSameAsPhoneNumber] = useState(false)

  const { phoneNumber } = usePatientAuthStore((state: any) => state.user) || {}

  const next = useNextOnboardingStep()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { isPending, isSuccess, mutateAsync } = useMutation({
    mutationFn: async (_data: Inputs) => {
      return { success: true }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Whatsapp number added successfully",
      })

      queryClient.invalidateQueries({
        queryKey: [patientLoginDetailsQueryKey],
      })
      navigate(next)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const handleCheckboxChange = (checked: boolean) => {
    setIsSameAsPhoneNumber(checked)
    if (checked) {
      setValue("whatsappPhoneNumber", phoneNumber)
    } else {
      setValue("whatsappPhoneNumber", "")
    }
  }

  return (
    <PatientAuthWrapper>
      <form
        className="flex flex-col gap-7"
        onSubmit={handleSubmit((data) => {
          mutateAsync(data)
        })}
      >
        <h1>Enter your WhatsApp number </h1>
        <p>This is where you will receive updates.</p>

        <input type="hidden" value="KE" {...register("whatsappCountryCode")} />

        <FormGroupInput
          id="whatsappPhoneNumber"
          label="WhatsApp Phone Number"
          type="phone"
          placeholder="Enter your WhatsApp phone number"
          register={register("whatsappPhoneNumber", {
            required: {
              value: true,
              message: "Please enter your phone number",
            },
            validate: (value) => {
              if (
                !validateCountryCode({
                  countryCode: watch("whatsappCountryCode"),
                  phoneNumber: value,
                })
              ) {
                return "Unfortunately, we only support phone numbers from Kenya at the moment"
              }

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
          sensitive
        />

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={isSameAsPhoneNumber}
            onCheckedChange={handleCheckboxChange}
          />
          <label
            htmlFor="terms"
            className="text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-left"
          >
            Same as my phone number ({phoneNumber})
          </label>
        </div>

        <Button
          className="w-full mt-5"
          isLoading={isPending}
          disabled={isPending || isSuccess}
        >
          Submit
        </Button>
      </form>
    </PatientAuthWrapper>
  )
}
