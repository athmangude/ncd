import { useForm } from "react-hook-form"
import FormGroupInput from "@/components/form/FormGroupInput"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Button } from "@/components/Button"
import { patientLoginDetailsQueryKey } from "../../hooks/useOnboardingChecklist"
import PatientPageWrapper from "../PatientPageWrapper"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"

type Inputs = {
  firstName: string
  lastName: string
}

export function PatientPersonalDetails() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const nextStep = useNextOnboardingStep()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.SIGNUP.PERSONAL_DETAILS_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const matchFields = {
        first_name: data.firstName,
        last_name: data.lastName,
        other_name: "",
        id_number: "",
      }
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/verify-phone-name-match`,
        { matchFields }
      )

      return response.data
    },
    onSuccess: () => {
      try {
        trackEvent(EVENTS.SIGNUP.PERSONAL_DETAILS_SUBMIT)
      } catch {
        // Silent fail
      }
      queryClient.invalidateQueries({ queryKey: [patientLoginDetailsQueryKey] })
      navigate(nextStep)
    },
    onError: (error: any) => {
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
      title=" "
      className="bg-white p-6 max-w-md mx-auto pb-32"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">What is your full name?</h1>
        <p className="text-neutral-500">This should match your National ID.</p>
      </div>

      <form
        className="flex flex-col flex-1"
        onSubmit={handleSubmit(async (data) => {
          await mutation.mutateAsync(data)
        })}
      >
        <div className="flex flex-col gap-5">
          <FormGroupInput
            id="firstName"
            label="First Name"
            type="text"
            placeholder="Enter your first name"
            register={register("firstName", {
              required: {
                value: true,
                message: "Please enter your first name",
              },
            })}
            error={errors.firstName?.message}
          />

          <FormGroupInput
            id="lastName"
            label="Last Name"
            type="text"
            placeholder="Enter your last name"
            register={register("lastName", {
              required: {
                value: true,
                message: "Please enter your last name",
              },
            })}
            error={errors.lastName?.message}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <div className="max-w-md mx-auto w-full">
            <Button
              className="w-full py-6 text-lg"
              size="lg"
              role="link"
              type="submit"
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
            >
              Submit personal details
            </Button>
          </div>
        </div>
      </form>
    </PatientPageWrapper>
  )
}
