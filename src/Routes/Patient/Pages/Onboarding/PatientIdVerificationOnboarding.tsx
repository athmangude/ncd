import { useForm } from "react-hook-form"
import FormGroupInput from "@/components/form/FormGroupInput"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { patientLoginDetailsQueryKey } from "../../hooks/useOnboardingChecklist"
import PatientPageWrapper from "../PatientPageWrapper"
import { DualActionFooter } from "@/Routes/shell/footers"

type Inputs = {
  idNumber: string
}

export function PatientIdVerificationOnboarding() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>()

  const idNumber = watch("idNumber")

  const nextStep = useNextOnboardingStep()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/verify-id-number`,
        data
      )

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [patientLoginDetailsQueryKey] })
      navigate(nextStep || "/patients")
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

  const onSubmit = handleSubmit(async (data) => {
    await mutation.mutateAsync(data)
  })

  return (
    <PatientPageWrapper
      title=""
      className="items-center"
      footer={
        <DualActionFooter
          secondary={{
            label: "Skip",
            onClick: () => navigate(nextStep || "/patients/"),
            disabled: mutation.isPending,
          }}
          primary={{
            label: "Submit",
            onClick: () => onSubmit(),
            disabled: !idNumber || mutation.isPending,
            isLoading: mutation.isPending,
          }}
        />
      }
    >
      <div className="w-full flex flex-col gap-8">
        <div className="text-center">
          <h1>Enter your National ID number</h1>
          <p className="text-neutral-500">
            Verify your identity and keep your account secure{" "}
          </p>
        </div>

        <form
          id="id-verification-onboarding-form"
          className="flex flex-col gap-5"
          onSubmit={onSubmit}
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
          />
        </form>
      </div>
    </PatientPageWrapper>
  )
}

export default PatientIdVerificationOnboarding
