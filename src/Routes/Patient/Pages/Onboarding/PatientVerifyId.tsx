import { Controller, useForm } from "react-hook-form"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { useToast } from "@/hooks/useToast"
import axios, { HttpStatusCode } from "axios"
import { useMutation } from "@tanstack/react-query"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import FormGroupInput from "@/components/form/FormGroupInput"
import { Button } from "@/components/Button"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
export type PatientIdType = "NATIONAL_ID" | "PASSPORT"

type Inputs = {
  countryCode: string
  idType: PatientIdType
  idNumber: string
}

export default function PatientVerifyId() {
  const [showProcessingPage, setShowProcessingPage] = useState(false)

  return (
    <PatientAuthWrapper>
      {showProcessingPage ? (
        <VerificationInProgress />
      ) : (
        <PatientVerifyIdForm setShowProcessingPage={setShowProcessingPage} />
      )}
    </PatientAuthWrapper>
  )
}

function VerificationInProgress() {
  const nextStep = useNextOnboardingStep()
  return (
    <div className="flex flex-col gap-5 text-center items-center p-5">
      <PatientAuthHeadline text="Your ID is being verified" />
      <p>We will send you an SMS notification once your ID is verified</p>

      <Link to={nextStep} className="w-full">
        <Button role="link" className="w-full">
          Proceed
        </Button>
      </Link>
    </div>
  )
}

function PatientVerifyIdForm({
  setShowProcessingPage,
}: {
  setShowProcessingPage: Function
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Inputs>()

  const nextStep = useNextOnboardingStep()
  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/verify-id`,
        data
      )

      return response
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: result.data.message,
      })

      if (result.status === HttpStatusCode.Accepted) {
        setShowProcessingPage(true)
        return
      }
      navigate(nextStep)
    },
    onError: (error: any) => {
      if (error.response?.status === HttpStatusCode.GatewayTimeout) {
        setShowProcessingPage(true)
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
    <>
      <PatientAuthHeadline text="Please type in your Identification Number" />
      <p>
        Please provide your government issued ID number for secure verification
      </p>

      <form
        className="flex flex-col gap-7"
        onSubmit={handleSubmit(async (data) => {
          await mutation.mutateAsync(data)
        })}
      >
        <Controller
          name="countryCode"
          control={control}
          rules={{
            required: {
              value: true,
              message: "Please select your country",
            },
          }}
          render={({ field }) => (
            <FormGroupSelect
              id="countryCode"
              label="Country Code"
              placeholder="Select Country Code"
              field={field}
              error={errors.countryCode?.message}
              options={[
                {
                  name: "Kenya",
                  value: "KE",
                },
              ]}
            />
          )}
        />

        <Controller
          name="idType"
          control={control}
          rules={{
            required: {
              value: true,
              message: "Please select your ID type",
            },
          }}
          render={({ field }) => (
            <FormGroupSelect
              id="idType"
              label="ID Type"
              placeholder="Select ID Type"
              field={field}
              error={errors.idType?.message}
              options={[
                {
                  name: "National ID",
                  value: "NATIONAL_ID",
                },
              ]}
            />
          )}
        />

        <FormGroupInput
          id="idNumber"
          label="ID Number"
          type="text"
          placeholder="Enter your ID number"
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

        <Button
          className="w-full"
          type="submit"
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
        >
          Verify
        </Button>
      </form>
    </>
  )
}
