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

  return (
    <PatientPageWrapper title="" className="items-center px-4">
      <div className="w-full flex flex-col gap-6 pb-24">
        <div className="flex flex-col gap-2">
           <h1 className="text-xl  text-center">Enter your National ID number</h1>
           <p className="text-neutral-500 text-center">Verify your identity and keep your account secure </p>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(async (data) => {
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
          />

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white  z-50">
            <div className="max-w-md mx-auto w-full flex gap-4">
              <Button
                className="w-1/3 "
                variant="secondary"
                type="button"
                onClick={() => navigate(nextStep || "/patients/")}
                disabled={mutation.isPending}
              >
                Skip
              </Button>
              <Button
                className="w-2/3"
                size="lg"
                role="link"
                type="submit"
                disabled={!idNumber || mutation.isPending}
                isLoading={mutation.isPending}
              >
                Submit
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PatientPageWrapper>
  )
}

export default PatientIdVerificationOnboarding

