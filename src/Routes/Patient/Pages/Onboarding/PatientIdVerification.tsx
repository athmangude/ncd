import { useForm } from "react-hook-form"
import FormGroupInput from "@/components/form/FormGroupInput"
import { useNavigate, useLocation } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import useNextKYCStep from "../../hooks/useNextKYCStep"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { patientLoginDetailsQueryKey } from "../../hooks/useOnboardingChecklist"
import PatientPageWrapper from "../PatientPageWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { useEffect } from "react"
import { trackEvent, EVENTS, maskIdNumber } from "@/analytics"

type Inputs = {
  idNumber: string
}

export function PatientIdVerification() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>()

  const idNumber = watch("idNumber")

  const nextStep = useNextKYCStep()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.KYC.ID_VERIFICATION_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/verify-id-number`,
        data
      )

      return response.data
    },
    onSuccess: () => {
      try {
        trackEvent(EVENTS.KYC.ID_VERIFICATION_SUCCESS)
      } catch {
        // Silent fail
      }
      queryClient.invalidateQueries({ queryKey: [patientLoginDetailsQueryKey] })
      navigate(nextStep || "/patients", { state: location.state })
    },
    onError: (error: any) => {
      try {
        trackEvent(EVENTS.KYC.ID_VERIFICATION_ERROR, {
          errorMessage: error?.response?.data?.message || error?.message,
        })
      } catch {
        // Silent fail
      }

      if (error.response?.status === 423) {
        navigate("/patients/id-verification-failure")
        return
      }

      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <PatientPageWrapper
      title=""
      className="items-center"
      footer={
        <PrimaryCTAFooter
          label="Submit"
          form="id-verification-form"
          type="submit"
          disabled={!idNumber || mutation.isPending}
          isLoading={mutation.isPending}
        />
      }
    >
      <div className="w-full flex flex-col gap-6">
        <div className="text-center">
          <h1>Enter your National ID number</h1>
          <p className="text-muted-foreground">
            Verify your identity and keep your account secure{" "}
          </p>
        </div>

        <form
          id="id-verification-form"
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(async (data) => {
            try {
              trackEvent(EVENTS.KYC.ID_VERIFICATION_SUBMIT, {
                maskedIdNumber: maskIdNumber(data.idNumber),
              })
            } catch {
              // Silent fail
            }
            await mutation.mutateAsync(data)
          })}
        >
          <FormGroupInput
            id="idNumber"
            label="National ID number"
            type="text"
            placeholder="12345678"
            register={register("idNumber", {
              required: {
                value: true,
                message: "Please enter your ID number",
              },
              maxLength: {
                value: 25,
                message: "ID number must be less than 25 digits",
              },
            })}
            error={errors.idNumber?.message}
            sensitive
          />
        </form>
      </div>
    </PatientPageWrapper>
  )
}

export default PatientIdVerification
