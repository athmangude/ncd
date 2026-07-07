import { useNavigate } from "react-router-dom"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { Button } from "@/components/Button"
import { useForm } from "react-hook-form" 
import axios from "axios"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"
import useNextReferralSetupStep from "../../hooks/useNextReferralSetupStep"
import FormGroupInput from "@/components/form/FormGroupInput"
import { patientLoginDetailsQueryKey } from "../../hooks/useOnboardingChecklist"

type Inputs = { referralCode: string }

export default function PatientReferralCode() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const { toast } = useToast()

  const next = useNextReferralSetupStep()
  const queryClient = useQueryClient()

  const linkReferralMutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/link-referral",
        data
      )

      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Referral code successfully linked",
      })
      queryClient.invalidateQueries({ queryKey: [patientLoginDetailsQueryKey] })

      navigate(next || "/patients")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message,
        variant: "destructive",
      })
    },
  })

  const skipReferralMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/skip-referral"
      )

      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Referral code successfully skipped",
      })
      queryClient.invalidateQueries({ queryKey: [patientLoginDetailsQueryKey] })
      navigate(next || "/patients")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message,
        variant: "destructive",
      })
    },
  })

  return (
    <PatientAuthWrapper>
      <form
        className="flex flex-col gap-7"
        onSubmit={handleSubmit(async (data) => {
          await linkReferralMutation.mutateAsync(data)
        })}
      >
        <PatientAuthHeadline text="Did someone help you to sign up?" />

        <h2 className="text-center">
          Enter the code you received from a receptionist or staff member
        </h2>

        <FormGroupInput
          id="referralCode"
          label="Referral Code"
          type="text"
          placeholder="e.g. AAASZQUSB"
          className="text-lg h-10"
          register={register("referralCode", {
            required: {
              value: true,
              message: "Please enter your referral code",
            },
            minLength: {
              value: 9,
              message: "Referral code must be 9 characters",
            },
            maxLength: {
              value: 9,
              message: "Referral code must be 9 characters",
            },
          })}
          error={errors.referralCode?.message}
        />

        <div className="flex flex-col gap-3 mt-5">
          <Button
            className="w-full"
            isLoading={linkReferralMutation.isPending}
            disabled={
              linkReferralMutation.isPending || skipReferralMutation.isPending
            }
          >
            Submit
          </Button>

          <Button
            type="button"
            className="w-full"
            onClick={async () => {
              await skipReferralMutation.mutateAsync()
            }}
            variant="outline"
            role="link"
            isLoading={skipReferralMutation.isPending}
            disabled={
              skipReferralMutation.isPending || linkReferralMutation.isPending
            }
          >
            Skip
          </Button>
        </div>
      </form>
    </PatientAuthWrapper>
  )
}
