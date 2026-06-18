import { useMutation, useQuery } from "@tanstack/react-query"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import axios from "axios"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Controller, useForm } from "react-hook-form"
import { useToast } from "@/hooks/useToast"
import { useNavigate } from "react-router-dom"
import FormGroupInput from "@/components/form/FormGroupInput"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { Button } from "@/components/Button"
import { isIdVerified } from "../../enums/PatientIdVerificationStatus"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { arrayToSelectOptions } from "@/utilities/textUtilities"

export const employmentDetailsQueryKey = "patientEmploymentDetails"
export default function PatientEmploymentDetails() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: [employmentDetailsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/id-verification-details`
      )

      return response.data
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const { error } = query as any

    //TODO: Fix this asap
    if (error.response?.data.message === "User has not verified their id") {
      navigate("/patients/verify-id")
    }

    return <ErrorBlock message={error.response?.data.message} />
  }

  return (
    <PatientAuthWrapper>
      <div>
        <PatientAuthHeadline text="We want to get to know who you are" />
        <p className="text-sm">
          We have filled out some of your identification information for you.
          Please fill out any missing information below.
        </p>
      </div>
      <IdVerificationDetails idVerificationDetails={query.data} />
      <EmploymentDetailsForm idVerificationDetails={query.data} />
    </PatientAuthWrapper>
  )
}

const employmentTypes = [
  "FULL_TIME",
  "PART_TIME",
  "SELF_EMPLOYED_OR_BUSINESS_OWNER",
  "STUDENT",
  "RETIRED",
  "OTHER",
]
type EmploymentType = typeof employmentTypes

const relationshipStatuses = ["SINGLE", "MARRIED", "DIVORCED", "OTHER"]
type RelationshipStatus = typeof relationshipStatuses

const numberOfChildren = ["NONE", "ONE", "TWO", "THREE", "FOUR_OR_MORE"]
type NumberOfChildren = typeof numberOfChildren

type Inputs = {
  email: string
  homeAddress: string
  employmentType: EmploymentType
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  numberOfChildren: NumberOfChildren
  relationshipStatus: RelationshipStatus
}

function EmploymentDetailsForm({
  idVerificationDetails,
}: {
  idVerificationDetails: any
}) {
  const { toast } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Inputs>()

  const nextStep = useNextOnboardingStep()

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const employmentDetailsPromise = axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/employment-details`,
        data
      )
      const crbScoringPromise = axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/underwriting/validate-crb-score`,
        data
      )

      const [employmentDetailsResponse] = await Promise.all([
        employmentDetailsPromise,
        crbScoringPromise,
      ])

      return employmentDetailsResponse.data
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: result.message,
      })
      navigate(nextStep)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const { firstName, lastName, gender, dateOfBirth } = idVerificationDetails

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit(async (data) => {
        await mutation.mutateAsync(data)
      })}
    >
      <FormGroupInput
        id="firstName"
        label="First Name"
        type="text"
        placeholder="Enter your first name address"
        register={register("firstName", {
          required: {
            value: true,
            message: "Please enter your first name",
          },
          value: firstName,
        })}
        error={errors.firstName?.message}
      />

      <FormGroupInput
        id="lastName"
        label="Last Name"
        type="text"
        placeholder="Enter your last name address"
        register={register("lastName", {
          required: {
            value: true,
            message: "Please enter your last name",
          },
          value: lastName,
        })}
        error={errors.lastName?.message}
      />

      <FormGroupInput
        id="dateOfBirth"
        label="Date of Birth"
        type="date"
        placeholder="Enter your date of birth"
        register={register("dateOfBirth", {
          required: {
            value: true,
            message: "Please enter your date of birth",
          },
          value: dateOfBirth,
        })}
        error={errors.dateOfBirth?.message}
      />
      <Controller
        name="gender"
        control={control}
        rules={{
          required: {
            value: true,
            message: "Please select your gender",
          },
          value: gender,
        }}
        render={({ field }) => (
          <FormGroupSelect
            id="gender"
            label="Gender"
            placeholder="Select Gender"
            field={field}
            error={errors.gender?.message}
            options={[
              {
                name: "Male",
                value: "MALE",
              },
              {
                name: "Female",
                value: "FEMALE",
              },
            ]}
          />
        )}
      />

      <FormGroupInput
        id="email"
        label="Email"
        type="email"
        placeholder="Enter your email address"
        register={register("email", {
          required: {
            value: true,
            message: "Please enter your email address",
          },
          pattern: {
            value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: "Please enter a valid email address",
          },
        })}
        error={errors.email?.message}
      />

      <FormGroupInput
        id="homeAddress"
        label="Home Address"
        type="text"
        placeholder="Enter your home address"
        register={register("homeAddress", {
          required: {
            value: true,
            message: "Please enter your home address",
          },
        })}
        error={errors.homeAddress?.message}
      />

      <Controller
        name="employmentType"
        control={control}
        rules={{
          required: {
            value: true,
            message: "Please select your employment type",
          },
        }}
        render={({ field }) => (
          <FormGroupSelect
            id="employmentType"
            label="Employment Type"
            placeholder="Select Employment Type"
            field={field}
            error={errors.employmentType?.message}
            options={arrayToSelectOptions(employmentTypes)}
          />
        )}
      />

      <Controller
        name="numberOfChildren"
        control={control}
        rules={{
          required: {
            value: true,
            message: "Please select how many children you have",
          },
        }}
        render={({ field }) => (
          <FormGroupSelect
            id="numberOfChildren"
            label="How many children do you have?"
            placeholder="Select how many children you have"
            field={field}
            error={errors.numberOfChildren?.message}
            options={arrayToSelectOptions(numberOfChildren)}
          />
        )}
      />

      <Controller
        name="relationshipStatus"
        control={control}
        rules={{
          required: {
            value: true,
            message: "Please select your relationship status",
          },
        }}
        render={({ field }) => (
          <FormGroupSelect
            id="relationshipStatus"
            label="Relationship Status"
            placeholder="Select Relationship Status"
            field={field}
            error={errors.relationshipStatus?.message}
            options={arrayToSelectOptions(relationshipStatuses)}
          />
        )}
      />

      <Button
        className="w-full"
        size="lg"
        role="link"
        type="submit"
        disabled={mutation.isPending}
        isLoading={mutation.isPending}
      >
        Submit
      </Button>
    </form>
  )
}

function IdVerificationDetails({
  idVerificationDetails,
}: {
  idVerificationDetails: any
}) {
  const { photo, idVerificationStatus } = idVerificationDetails

  if (!isIdVerified(idVerificationStatus)) {
    return null
  }

  return (
    <div className="flex justify-center">
      <img
        src={"data:image/jpeg;base64," + photo}
        alt="Photo"
        className="h-[150px] aspect-square mx-auto rounded-3xl object-cover border-2 shadow-lg my-auto"
      />

      {/* <h3 className="flex flex-col col-span-3">
        <div className="font-medium">ID Address</div>
        {address}
      </h3> */}
    </div>
  )
}
