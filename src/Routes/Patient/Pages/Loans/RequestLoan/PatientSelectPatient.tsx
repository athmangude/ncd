import { Controller } from "react-hook-form"
import PatientPageWrapper from "../../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import patientIcon from "@/assets/icons/patient.png"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import PatientDependentSelect from "@/Routes/Patient/components/PatientDependentSelect"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useLocation, useNavigate } from "react-router-dom"
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
type Inputs = {
  patientId: string
}

export const patientSelectStorageKey = "patientSelectPatient"
export const patientConnectionsQueryKey = "patientConnections"

export default function PatientSelectPatient() {
  const location = useLocation()
  const navState = location.state as {
    preselectedPatientId?: string
    patientId?: string
  } | null
  const preselectedPatientId =
    navState?.preselectedPatientId ?? navState?.patientId

  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = usePersistentForm<Inputs>(patientSelectStorageKey)

  const user = usePatientAuthStore((state: any) => state.user)

  const query = useQuery({
    queryKey: [patientConnectionsQueryKey],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("network_members")
        .select("*")
        .eq("user_id", authUser.id)
      if (error) throw error

      const patients = (data || []).map((m: Record<string, unknown>) => ({
        name: `${m.first_name} ${m.last_name}`,
        value: m.id,
        status: m.status,
        phoneNumber: m.phone_number,
        photo: m.profile_photo,
        firstName: m.first_name,
        lastName: m.last_name,
      }))

      return { patients }
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const { patients = [] } = query.data!

  let patientOptions = [
    {
      name: `${user?.firstName} ${user?.lastName}`,
      value: user?.id,
      status: "SELF",
      phoneNumber: user?.phoneNumber,
      photo: user?.idVerification?.photo,
    },
  ]

  if (patients) {
    patientOptions = [...patientOptions, ...patients] as any[]
  }

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Select patient"
      headerIcon={<img src={patientIcon} alt="" className={HEADER_ICON} />}
      pageTitle="Who is the patient today?"
      primaryCta={{
        label: "Continue",
        type: "submit",
        form: "select-patient-form",
      }}
    >
      <form
        id="select-patient-form"
        className="flex flex-col gap-7"
        onSubmit={handleSubmit((data) => {
          const patient = patientOptions.find(
            (patient: any) => patient.value === data.patientId
          ) as any

          const storedData =
            getFromLocalStorage(patientReviewInvoiceStorageKey) || {}

          setToLocalStorage(patientReviewInvoiceStorageKey, {
            ...storedData,
            patient: {
              id: patient?.value,
              firstName:
                patient?.firstName || patient?.name?.split(" ")[0] || "",
              lastName:
                patient?.lastName ||
                patient?.name?.split(" ").slice(1).join(" ") ||
                "",
              phoneNumber: patient?.phoneNumber,
              status: patient?.status,
            },
          })

          navigate("/patients/payment/request-payment/review-invoice")
        })}
      >
        <Controller
          name="patientId"
          control={control as any}
          rules={{ required: "Patient is required" }}
          defaultValue={
            control._defaultValues["patientId"] ?? preselectedPatientId
          }
          render={({ field }) => (
            <PatientDependentSelect
              id="patientId"
              label="Patient"
              placeholder="Select a patient"
              items={patientOptions}
              field={field}
              error={errors.patientId?.message}
              defaultValue={
                control._defaultValues["patientId"] ?? preselectedPatientId
              }
              action={{
                fn: () => {
                  navigate("/patients/network/add-connection", {
                    state: {
                      from: "select-patient",
                    },
                  })
                },
                label: "Add patient",
              }}
            />
          )}
        />
      </form>
    </PatientPageWrapper>
  )
}
