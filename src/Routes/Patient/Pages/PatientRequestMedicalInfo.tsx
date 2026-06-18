import PatientPageWrapper from "./PatientPageWrapper"
import { Controller, useForm } from "react-hook-form"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/Button"
import { useState } from "react"
import { Checkbox } from "@/components/Checkbox"
import LoadingPage from "@/Routes/LoadingPage"
import axios from "axios"
import ErrorBlock from "@/components/ErrorBlock"
import FormGroupTextarea from "@/components/form/FormGroupTextarea"
import { useToast } from "@/hooks/useToast"
import SuccessBlock from "@/components/SuccessBlock"
import { useNavigate } from "react-router-dom"

export default function PatientRequestMedicalInfo() {
  return (
    <>
      <MedicalInformationForm />
    </>
  )
}

type Inputs = {
  hasAcceptedConsentForm: boolean
  recipient: string
  careProviderId: string
  description: string
}

const queryKey = "request-medical-info"

function MedicalInformationForm() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/request-medical-info-form-data`
      )
      return response.data
    },
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      data = {
        ...data,
        hasAcceptedConsentForm: hasAcceptedTerms,
      }
      const response = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/request-medical-info`,
        data
      )

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

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  if (mutation.isSuccess) {
    return (
      <SuccessBlock
        title="Your Medical Info Request has been submitted"
        message="We will notify you once it is approved"
        action={{
          label: "Back to Dashboard",
          onClick: () => navigate("/patients/"),
        }}
      />
    )
  }

  const { careProviders } = query.data

  return (
    <PatientPageWrapper title="Medical Info">
      <p className="">
        We will collect the details of your medical need and update you on your
        application status
      </p>
      <form
        className="flex flex-col gap-7 mt-5"
        onSubmit={handleSubmit(async (data) => {
          await mutation.mutateAsync(data)
        })}
      >
        <Controller
          name="recipient"
          control={control}
          render={({ field }) => (
            <FormGroupSelect
              id="recipient"
              label="Who is this request for?"
              placeholder="Select who is this request for"
              field={field}
              error={errors.recipient?.message}
              options={[
                {
                  name: "Myself",
                  value: "SELF",
                },
                {
                  name: "Child",
                  value: "CHILD",
                },
                {
                  name: "Spouse",
                  value: "SPOUSE",
                },
                {
                  name: "Parent",
                  value: "PARENT",
                },
                {
                  name: "Other",
                  value: "OTHER",
                },
              ]}
            />
          )}
        />

        <Controller
          name="careProviderId"
          control={control}
          render={({ field }) => (
            <FormGroupSelect
              id="careProviderId"
              label="Care Provider Name"
              placeholder="Select care provider"
              field={field}
              error={errors.careProviderId?.message}
              options={careProviders}
            />
          )}
        />
        <FormGroupTextarea
          id="description"
          label="Description"
          placeholder="Enter your description"
          register={register("description", {
            required: {
              value: true,
              message: "Please enter your description",
            },
          })}
          error={errors.description?.message}
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={hasAcceptedTerms}
            onCheckedChange={() => setHasAcceptedTerms(!hasAcceptedTerms)}
          />
          <label
            htmlFor="terms"
            className="text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            By checking this box, I consent to my medical care provider securely
            sharing my medical information with Jireh in line with the Data
            Sharing Agreement
          </label>
        </div>
        <Button
          className="w-full"
          size="lg"
          role="link"
          type="submit"
          disabled={!hasAcceptedTerms || mutation.isPending}
          isLoading={mutation.isPending}
        >
          Request Medical Information
        </Button>
      </form>
    </PatientPageWrapper>
  )
}
