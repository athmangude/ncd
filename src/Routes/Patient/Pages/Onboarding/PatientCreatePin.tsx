import { useForm } from "react-hook-form"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import FormGroup from "@/components/form/FormGroupInput"
import { SessionAuth } from "supertokens-auth-react/recipe/session"
import { useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import ErrorMessage from "@/components/ErrorMessage"
import { PatientUser } from "../../models/PatientUser"
import { patientLoginDetailsQueryKey } from "../PatientsHome"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useToast } from "@/hooks/useToast"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

type Inputs = {
  patientPIN: string
  confirmPatientPIN: string
}

export default function PatientCreatePin() {
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.signUpDetails)
  const setUser = usePatientAuthStore((state: any) => state.setUser)
  const { toast } = useToast()

  const query = useQuery({
    queryKey: [patientLoginDetailsQueryKey],
    queryFn: async () => {
      //check if user has created a pin

      try {
        const res = await axios.get(
          import.meta.env.VITE_API_BASE_URL + "/patients/login-details"
        )

        setUser(res.data as PatientUser)
        return res.data as PatientUser
      } catch (error: any) {
        if (error.response?.status === 401) {
          navigate("/patients/auth/login")
          return null
        }

        if (error.response?.status === 403) {
          navigate("/invalid-tenant")
          return null
        }

        throw error
      }
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.patientPIN !== data.confirmPatientPIN) {
        throw new Error("PINs do not match")
      }

      const { id } = query.data as any

      const req = {
        id: user?.userId || id,
        pin: data.patientPIN,
        firstName: user?.firstName || data.patientFirstName,
        lastName: user?.lastName || data.patientLastName,
      }

      const res = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/",
        req
      )

      const newUser: PatientUser = {
        id: res.data.data.id,
        email: res.data.data.email,
        firstName: res.data.data.firstName,
        lastName: res.data.data.lastName,
        phoneNumber: res.data.data.phoneNumber,
        isVerified: res.data.data.isVerified,
      }

      setUser(newUser)

      navigate("/patients/verify-id")
      return
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  return (
    <SessionAuth requireAuth={true}>
      <PatientAuthWrapper
        footer={
          <PrimaryCTAFooter
            label="Submit"
            form="create-pin-form"
            type="submit"
            isLoading={createPatientMutation.isPending}
            disabled={createPatientMutation.isPending}
          />
        }
      >
        <form
          id="create-pin-form"
          className="flex flex-col gap-7"
          onSubmit={handleSubmit(async (data) =>
            createPatientMutation.mutate(data)
          )}
        >
          <h1 className="text-xl font-medium">Complete signup</h1>

          <FormGroup
            id="patientPIN"
            label="PIN"
            type="password"
            inputMode="numeric"
            placeholder="Enter a 4 digit pin"
            register={register("patientPIN", {
              required: {
                value: true,
                message: "Enter a 4 digit pin",
              },
              maxLength: {
                value: 4,
                message: "PIN must be 4 digits",
              },
              minLength: {
                value: 4,
                message: "PIN must be 4 digits",
              },
            })}
            error={errors.patientPIN?.message}
          />
          <FormGroup
            id="confirmPatientPIN"
            label="Confirm PIN"
            type="password"
            inputMode="numeric"
            placeholder="Enter a 4 digit pin"
            register={register("confirmPatientPIN", {
              required: {
                value: true,
                message: "Enter a 4 digit pin",
              },
              maxLength: {
                value: 4,
                message: "PIN must be 4 digits",
              },
              minLength: {
                value: 4,
                message: "PIN must be 4 digits",
              },
            })}
            error={errors.patientPIN?.message}
          />

          {createPatientMutation.isError && (
            <ErrorMessage message={createPatientMutation.error.message} />
          )}
        </form>
      </PatientAuthWrapper>
    </SessionAuth>
  )
}
