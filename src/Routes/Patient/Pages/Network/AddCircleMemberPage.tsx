import PatientPageWrapper from "../PatientPageWrapper"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import FormGroupInput from "@/components/form/FormGroupInput"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { Controller } from "react-hook-form"
import { Button } from "@/components/Button"
import { validatePhoneNumber } from "@/utilities/validators"
import { relationshipOptions } from "./PatientAddConnection"
import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs"
import { useEffect, useState } from "react"
import {
  setToLocalStorage,
  getFromLocalStorage,
} from "@/utilities/localStorage"
import { PENDING_INVITE_KEY } from "./InviteMethodPage"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { Calendar } from "@/components/Calendar"
import { Label } from "@/components/Label"
import ErrorMessage from "@/components/ErrorMessage"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate } from "react-router-dom"
import { useNetworkData } from "./hooks/useNetworkData"
import { useCircleSync } from "../../hooks/useCircleSync"

const addNewConnectionStorageKey = "add-new-connection-drawer"

export type Inputs = {
  firstName: string
  lastName: string
  relationship: string
  phoneNumber: string
  dateOfBirth: string
  nickname?: string
}

type LocationState = {
  source?: "onboarding" | "network"
  returnPath?: string
  inviteMethod?: "text" | "voice"
  prefill?: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    relationship?: string
  }
  [key: string]: unknown
}

export default function AddCircleMemberPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as LocationState
  const inviteMethod = state.inviteMethod
  const prefill = state.prefill
  const returnPath = state.returnPath || "/patients/network"

  const { data: networkData, refetch } = useNetworkData()
  const slots = networkData?.slots
  const syncCircle = useCircleSync()

  const pendingInviteData = getFromLocalStorage(
    PENDING_INVITE_KEY
  ) as Partial<Inputs> | null
  const savedFormState = getFromLocalStorage(
    addNewConnectionStorageKey
  ) as Partial<Inputs> | null

  const { toast } = useToast()

  const initialRelationship =
    savedFormState?.relationship || pendingInviteData?.relationship

  const isAccountableFull = slots?.accountable
    ? slots.accountable.used + slots.accountable.reserved >=
      slots.accountable.max
    : false
  const isAuxiliaryFull = slots?.auxiliary
    ? slots.auxiliary.used + slots.auxiliary.reserved >= slots.auxiliary.max
    : false

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"adult" | "child">(() => {
    if (initialRelationship === "CHILD" && !isAuxiliaryFull) return "child"
    if (isAccountableFull && !isAuxiliaryFull) return "child"
    return "adult"
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = usePersistentForm<Inputs>(addNewConnectionStorageKey, {
    defaultValues: pendingInviteData
      ? (pendingInviteData as Inputs)
      : undefined,
  })

  useEffect(() => {
    const currentRelationship = watch("relationship")
    if (activeTab === "child") {
      if (currentRelationship !== "CHILD") {
        setValue("relationship", "CHILD")
      }
    } else {
      if (currentRelationship === "CHILD") {
        setValue("relationship", "")
      }
    }
  }, [activeTab, setValue, watch])

  useEffect(() => {
    if (prefill) {
      reset({
        firstName: prefill.firstName ?? "",
        lastName: prefill.lastName ?? "",
        phoneNumber: prefill.phoneNumber ?? "",
        relationship: prefill.relationship ?? "",
        dateOfBirth: "",
        nickname: "",
      })
    }
  }, [prefill, reset])

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const payload = { ...data }

      if (payload.relationship === "CHILD") {
        delete (payload as { phoneNumber?: string }).phoneNumber
      }

      const response = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/patient-network/send-invite",
        payload
      )

      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Child added successfully",
      })

      refetch()
      // Keep the loan gate + payee pickers in sync with the just-added member,
      // not just this page's network query.
      syncCircle()
      reset()
      navigate(returnPath, { state })
    },
    onError: (error: unknown) => {
      const e = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      toast({
        title: "Error",
        description:
          e.response?.data?.message || e.message || "Failed to add child",
        variant: "destructive",
      })
    },
  })

  const validateInviteMutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/circles/invites/validate",
        data
      )

      return response.data as {
        isValid: boolean
        message: string
        isResend?: boolean
      }
    },
    onSuccess: (data, variables) => {
      if (data.isValid) {
        const payload = { ...variables }

        if (payload.relationship === "CHILD") {
          delete (payload as { phoneNumber?: string }).phoneNumber
        }

        setToLocalStorage(PENDING_INVITE_KEY, { ...payload, inviteMethod })
        reset()

        if (inviteMethod === "text") {
          navigate("/patients/network/invite-text", { state })
        } else if (inviteMethod === "voice") {
          navigate("/patients/network/invite-voice", { state })
        } else {
          navigate("/patients/network/invite-method", { state })
        }
      } else {
        toast({
          title: "Cannot send invite",
          description: data.message,
          variant: "destructive",
        })
      }
    },
    onError: (error: unknown) => {
      const e = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      toast({
        title: "Error",
        description:
          e.response?.data?.message || e.message || "Failed to validate invite",
        variant: "destructive",
      })
    },
  })

  const handleSave = (data: Inputs) => {
    if (activeTab === "child") {
      mutation.mutate(data)
      return
    }

    validateInviteMutation.mutate(data)
  }

  const filteredRelationshipOptions = relationshipOptions.filter((option) => {
    if (activeTab === "adult") {
      return option.value !== "CHILD"
    }
    return option.value === "CHILD"
  })

  const pageTitle =
    inviteMethod === "voice" ? "Invite by voice note" : "Invite by SMS"

  return (
    <PatientPageWrapper title={pageTitle}>
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground">Add their contacts</h2>
        <p className="text-sm text-muted-foreground">
          Choose people who&apos;ll say yes
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "adult" | "child")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 gap-2">
          <TabsTrigger
            value="adult"
            disabled={isAccountableFull}
            className="flex flex-col items-center py-3 px-2 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-semibold text-foreground">Adult</span>
            <span className="text-xs text-muted-foreground font-normal">
              {isAccountableFull ? "Max limit reached" : "above 18 years"}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="child"
            disabled={isAuxiliaryFull}
            className="flex flex-col items-center py-3 px-2 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-semibold text-foreground">Junior</span>
            <span className="text-xs text-muted-foreground font-normal">
              {isAuxiliaryFull ? "Max limit reached" : "below 18 years"}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(handleSave)}>
        <div className="grid grid-cols-2 gap-2">
          <FormGroupInput
            id="firstName"
            label="First Name"
            type="text"
            placeholder="Firstname"
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
                  "No numbers or special characters allowed in first name",
              },
            })}
            error={errors.firstName?.message}
            defaultValue={control._defaultValues["firstName"]?.toString()}
          />

          <FormGroupInput
            id="lastName"
            label="Last Name"
            type="text"
            placeholder="Lastname"
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
              placeholder={
                activeTab === "child" ? "Child" : "Select relationship"
              }
              field={field}
              error={errors.relationship?.message}
              options={filteredRelationshipOptions}
              defaultValue={control._defaultValues["relationship"]?.toString()}
            />
          )}
        />

        {activeTab === "adult" && (
          <FormGroupInput
            id="phoneNumber"
            label="Phone Number"
            type="phone"
            placeholder="0712345678"
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

        {activeTab === "adult" && (
          <p className="text-sm text-muted-foreground">
            They will receive an invite to join
          </p>
        )}

        {activeTab === "child" && (
          <Controller
            name="dateOfBirth"
            control={control}
            rules={{
              required: "Please enter the date of birth",
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
            }}
            render={({ field }) => {
              const selectedDate = field.value
                ? new Date(field.value)
                : undefined
              const today = new Date()
              const minBirth = new Date(
                today.getFullYear() - 18,
                today.getMonth(),
                today.getDate()
              )
              return (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dateOfBirth">Date of birth</Label>
                  <button
                    type="button"
                    id="dateOfBirth"
                    onClick={() => setCalendarOpen((o) => !o)}
                    className={cn(
                      "flex items-center h-10 w-full rounded-md border bg-background px-3 py-2 text-sm text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A020F0] focus-visible:ring-offset-2",
                      !field.value && "text-muted-foreground",
                      errors.dateOfBirth ? "border-destructive" : "border-input"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </button>
                  {calendarOpen && (
                    <div className="rounded-lg border border-input overflow-hidden">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) field.onChange(format(date, "yyyy-MM-dd"))
                          setCalendarOpen(false)
                        }}
                        disabled={(date) => date > today || date < minBirth}
                        defaultMonth={
                          selectedDate ?? new Date(today.getFullYear() - 5, 0)
                        }
                        captionLayout="dropdown"
                        startMonth={minBirth}
                        endMonth={today}
                      />
                    </div>
                  )}
                  {errors.dateOfBirth?.message && (
                    <ErrorMessage message={errors.dateOfBirth.message} />
                  )}
                </div>
              )
            }}
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

        <Button
          className="w-full bg-[#A822F4] hover:bg-[#901DD0]"
          disabled={mutation.isPending || validateInviteMutation.isPending}
        >
          {mutation.isPending || validateInviteMutation.isPending
            ? "Saving..."
            : "Next"}
        </Button>
      </form>
    </PatientPageWrapper>
  )
}
