import { useLocation, useNavigate } from "react-router-dom"
import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import FormGroupInput from "@/components/form/FormGroupInput"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { Controller } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"
import axios from "axios"
import { validatePhoneNumber } from "@/utilities/validators"
import { patientTreatmentDetailsStorageKey } from "../Loans/RequestLoan/PatientTreatmentDetails"
import { patientConnectionsQueryKey } from "../Loans/RequestLoan/PatientSelectPatient"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"
import { setToLocalStorage } from "@/utilities/localStorage"
import { PENDING_INVITE_KEY } from "./InviteMethodPage"

const addNewConnectionStorageKey = "add-new-connection"
type Inputs = {
  firstName: string
  lastName: string
  relationship: string
  phoneNumber: string
  dateOfBirth: string
  nickname?: string
}

// eslint-disable-next-line react-refresh/only-export-components
export const relationshipOptions = [
  { value: "SPOUSE", name: "Spouse" },
  { value: "SIBLING", name: "Sibling" },
  { value: "CHILD", name: "Junior (below 18 years)" },
  { value: "CHILD_OVER_18", name: "Child (over 18 years)" },
  { value: "PARENT", name: "Parent" },
  { value: "FRIEND", name: "Friend" },
  { value: "COLLEAGUE", name: "Colleague" },
  { value: "OTHER", name: "Other" },
]

const callbackMap: Record<string, string> = {
  "treatment-details": "/patients/payment/request-payment/treatment-details",
  "select-patient": "/patients/payment/request-payment/select-patient",
  "upload-invoice": "/patients/payment/request-payment/upload-invoice",
  "gift-recipient": "/patients/care-fund/gift-recipient",
  "fast-track-payment-details": "/patients/fast-track/payment-details",
  network: "/patients/network",
}

type AddConnectionLocationState =
  | {
      from?: string
      flow?: "invite-voice" | "invite-text"
      inviteMethod?: "voice" | "text"
      source?: string
    }
  | undefined

const isVoiceOrTextFlow = (
  s: AddConnectionLocationState
): s is AddConnectionLocationState & {
  flow: "invite-voice" | "invite-text"
  inviteMethod: "voice" | "text"
} => s != null && (s.flow === "invite-voice" || s.flow === "invite-text")

export default function PatientAddConnection() {
  const location = useLocation()
  const state = location.state as AddConnectionLocationState
  const isPaymentFlowAdd =
    state?.from === "treatment-details" ||
    state?.from === "select-patient" ||
    state?.from === "upload-invoice" ||
    state?.from === "fast-track-payment-details"
  const title = isPaymentFlowAdd
    ? "Add Patient"
    : isVoiceOrTextFlow(state)
      ? "Who are you inviting?"
      : "Add Connection"

  const { toast } = useToast()

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = usePersistentForm<Inputs>(addNewConnectionStorageKey)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.CIRCLE.ADD_CONNECTION_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const payload = { ...data }

      if (payload.relationship === "CHILD") {
        delete (payload as any).phoneNumber
      }

      const response = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/patient-network/send-invite",
        payload
      )

      return response.data
    },
    onSuccess: (data: any) => {
      try {
        trackEvent(EVENTS.CIRCLE.ADD_CONNECTION_SUCCESS, {
          relationship: data.relationship,
        })
      } catch {
        // Silent fail
      }

      toast({
        title: "Success",
        description: data.message,
      })

      const redirectLink = state?.from ? callbackMap[state.from] : undefined
      if (redirectLink) {
        queryClient.invalidateQueries({
          queryKey: [patientTreatmentDetailsStorageKey],
        })
        if (
          state?.from === "select-patient" ||
          state?.from === "fast-track-payment-details"
        ) {
          queryClient.invalidateQueries({
            queryKey: [patientConnectionsQueryKey],
          })
        }
      }

      navigate(redirectLink ?? "/patients/network", {
        state: {
          patient: {
            id: data.patientId,
            name: `${data.firstName} ${data.lastName}`,
          },
          status: data.status,
        },
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: Inputs) => {
    try {
      trackEvent(EVENTS.CIRCLE.ADD_CONNECTION_SUBMIT, {
        relationship: data.relationship,
      })
    } catch {
      // Silent fail
    }
    if (state && isVoiceOrTextFlow(state)) {
      const payload = { ...data, inviteMethod: state.inviteMethod }
      if (payload.relationship === "CHILD") {
        delete (payload as any).phoneNumber
      }
      setToLocalStorage(PENDING_INVITE_KEY, payload)
      toast({
        title: "Saved",
        description: "Continue to personalize your invite.",
      })
      const target =
        state.flow === "invite-voice"
          ? "/patients/network/invite-voice"
          : "/patients/network/invite-text"
      navigate(target, { state: { source: state.source } })
      return
    }
    mutation.mutate(data)
  }

  const backTarget = state?.from && callbackMap[state.from]
  const handleBack = backTarget
    ? () => navigate(backTarget, { replace: true })
    : undefined

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title={title}
          onBack={handleBack ?? (() => navigate(-1))}
        />
      }
      footer={
        <PrimaryCTAFooter
          label={isVoiceOrTextFlow(state) ? "Continue" : "Add Connection"}
          type="submit"
          form="add-connection-form"
          isLoading={mutation.isPending}
          disabled={mutation.isPending || mutation.isSuccess}
        />
      }
    >
      <form
        id="add-connection-form"
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-2 gap-2">
          <FormGroupInput
            id="firstName"
            label="First Name"
            type="text"
            placeholder="Enter the first name"
            register={register("firstName", {
              required: {
                value: true,
                message: "Please enter the first name",
              },
              minLength: {
                value: 2,
                message: "First name must be at least 2 characters",
              },
              pattern: {
                value: /^[a-zA-Z\s]+$/,
                message:
                  "No numbers or special characters allowed in first name ",
              },
            })}
            error={errors.firstName?.message}
            defaultValue={control._defaultValues["firstName"]?.toString()}
          />

          <FormGroupInput
            id="lastName"
            label="Last Name"
            type="text"
            placeholder="Enter the last name"
            register={register("lastName", {
              required: {
                value: true,
                message: "Please enter the last name",
              },
              minLength: {
                value: 2,
                message: "Last name must be at least 2 characters",
              },
              pattern: {
                value: /^[a-zA-Z\s]+$/,
                message:
                  "No numbers or special characters allowed in last name",
              },
            })}
            error={errors.lastName?.message}
            defaultValue={control._defaultValues["lastName"]?.toString()}
          />
        </div>

        <Controller
          name="relationship"
          control={control}
          rules={{ required: "Relationship is required" }}
          render={({ field }) => (
            <FormGroupSelect
              id="relationship"
              label="Relationship to you"
              placeholder="Select relationship"
              field={field}
              error={errors.relationship?.message}
              options={relationshipOptions}
              defaultValue={control._defaultValues["relationship"]?.toString()}
            />
          )}
        />

        {watch("relationship") !== "CHILD" && (
          <FormGroupInput
            id="phoneNumber"
            label="Phone Number"
            type="phone"
            placeholder="Enter phone number"
            register={register("phoneNumber", {
              required: {
                value: true,
                message: "Please enter your phone number",
              },
              validate: (value) => {
                if (
                  !validatePhoneNumber({
                    countryCode: "KE",
                    phoneNumber: value,
                  })
                ) {
                  return "Please enter a valid phone number"
                }

                return true
              },
            })}
            error={errors.phoneNumber?.message}
            defaultValue={control._defaultValues["phoneNumber"]?.toString()}
          />
        )}

        {watch("relationship") === "CHILD" && (
          <FormGroupInput
            id="dateOfBirth"
            label="Date of birth"
            type="date"
            placeholder=""
            register={register("dateOfBirth", {
              required: {
                value: true,
                message: "Please enter the date of birth",
              },
              validate: (value) => {
                if (!value) return true
                const birth = new Date(value)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                birth.setHours(0, 0, 0, 0)
                if (birth > today)
                  return "Date of birth cannot be in the future"
                const minBirth = new Date(today)
                minBirth.setFullYear(minBirth.getFullYear() - 18)
                if (birth < minBirth) return "Child must be under 18 years"
                return true
              },
            })}
            error={errors.dateOfBirth?.message}
            defaultValue={control._defaultValues["dateOfBirth"]?.toString()}
          />
        )}

        <FormGroupInput
          id="nickname"
          label="Nickname (optional)"
          type="text"
          placeholder="e.g Mum"
          register={register("nickname", {
            pattern: {
              value: /^[a-zA-Z\s]+$/,
              message: "No numbers or special characters allowed in nickname",
            },
          })}
          error={errors.nickname?.message}
          defaultValue={control._defaultValues["nickname"]?.toString()}
        />
      </form>
    </MobileWrapper>
  )
}
