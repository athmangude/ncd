import { Controller } from "react-hook-form"
import PatientPageWrapper from "../PatientPageWrapper"
import healthUserIcon from "@/assets/icons/health-user.png"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import PatientDependentSelect from "../../components/PatientDependentSelect"
import { patientConnectionsQueryKey } from "../Loans/RequestLoan/PatientSelectPatient"
import { supabase } from "@/lib/supabase"
import { useMutation, useQuery } from "@tanstack/react-query"
import ErrorBlock from "@/components/ErrorBlock"
import LoadingPage from "@/Routes/LoadingPage"
import { useLocation, useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Drawer,
} from "@/components/Drawer"
import { useState } from "react"
import { Button } from "@/components/Button"
import giftBoxIcon from "@/assets/icons/gift-box.png"
import FormGroupInput from "@/components/form/FormGroupInput"
import { formatMoney } from "@/utilities/currencyUtilities"
import { usePatientAuthStore } from "../../stores/patientAuthStore"

const patientGiftRecipientStorageKey = "patientGiftRecipient"

type Inputs = {
  patientId: string
  transferAmount: number
}

export default function PatientGiftRecipient() {
  const { careFundAccount } =
    usePatientAuthStore((state: any) => state.user) || {}

  const { careFundBalance, currency } = careFundAccount || {}

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = usePersistentForm<Inputs>(patientGiftRecipientStorageKey)

  const navigate = useNavigate()

  const location = useLocation()
  const preselectedPatientId = (
    location.state as { preselectedPatientId?: string } | null
  )?.preselectedPatientId

  const { isLoading, isError, data } = useQuery({
    queryKey: [patientConnectionsQueryKey],
    queryFn: async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) throw new Error("Not authenticated")

      const { data: members, error } = await supabase
        .from("network_members")
        .select("*")
        .eq("user_id", authUser.id)
      if (error) throw error

      const patients = (members || []).map(
        (m: Record<string, unknown>) => ({
          name: `${m.first_name} ${m.last_name}`,
          value: String(m.id ?? ""),
          status: String(m.status ?? ""),
          phoneNumber: String(m.phone_number ?? ""),
          photo: String(m.profile_photo ?? ""),
          firstName: String(m.first_name ?? ""),
          lastName: String(m.last_name ?? ""),
        })
      )

      return { patients }
    },
  })

  const [transferDetails, setTransferDetails] = useState<any>(null)

  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return <LoadingPage />
  }

  if (isError) {
    return <ErrorBlock />
  }

  const { patients = [] } = data || {}

  const patientOptions = patients.filter(
    (patient: any) =>
      patient.status !== "CHILD" && patient.status !== "REJECTED"
  )

  return (
    <PatientPageWrapper
      title="Gift Recipient"
      primaryCta={{
        label: "Continue",
        type: "submit",
        form: "gift-recipient-form",
        onClick: () => {
          setIsOpen(true)
        },
      }}
    >
      <form
        id="gift-recipient-form"
        className="flex flex-col gap-7"
        onSubmit={handleSubmit((data) => {
          const patient = patients.find(
            (patient: any) => patient.value === data.patientId
          )

          const details = {
            patient,
            transferAmount: data.transferAmount,
            currency: currency.code,
          }

          setTransferDetails(details)
        })}
      >
        <img
          src={healthUserIcon}
          alt="Health User Icon"
          className="aspect-square p-2 object-contain w-full max-w-[100px] mx-auto"
          aria-hidden="true"
        />

        <h1 className="text-center">Who is receiving your gift?</h1>

        <Controller
          name="patientId"
          control={control as any}
          rules={{ required: "Recipient is required" }}
          defaultValue={
            control._defaultValues["patientId"] ?? preselectedPatientId
          }
          render={({ field }) => (
            <PatientDependentSelect
              id="patientId"
              label="Recipient"
              placeholder="Select a recipient"
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
                      from: "gift-recipient",
                    },
                  })
                },
                label: "Add Connection",
              }}
            />
          )}
        />

        <FormGroupInput
          id="transferAmount"
          label="Transfer"
          type="number"
          placeholder="Enter the tranfer amount"
          register={register("transferAmount", {
            required: {
              value: true,
              message: "Please enter the tranfer amount",
            },
            max: {
              value: careFundBalance,
              message: `Transfer amount cannot exceed ${formatMoney(
                careFundBalance,
                currency.code
              )}`,
            },
          })}
          error={errors.transferAmount?.message}
          description={`Max: ${formatMoney(careFundBalance, currency.code)}`}
        />

        {transferDetails && (
          <ConfirmGiftRecipient
            transferDetails={transferDetails}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            reset={reset}
          />
        )}
      </form>
    </PatientPageWrapper>
  )
}

function ConfirmGiftRecipient({
  transferDetails,
  isOpen,
  setIsOpen,
  reset,
}: {
  transferDetails: any
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  reset: () => void
}) {
  const { toast } = useToast()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase.rpc(
        "rpc_care_fund_transfer",
        {
          p_amount: Number(transferDetails.transferAmount),
          p_receiver_phone: transferDetails.patient.phoneNumber ?? "",
          p_description: `Gift to ${transferDetails.patient.name}`,
        }
      )

      if (error) throw error
      return result
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Discount transferred successfully",
      })

      reset()
      navigate("/patients/care-fund/success", {
        state: {
          transferDetails: transferDetails,
        },
      })
    },
    onError: (error: unknown) => {
      const err = error as { message?: string }
      toast({
        title: "Error",
        description: err.message || "Transfer failed",
        variant: "destructive",
      })
    },
  })

  const buttonDisabled = mutation.isPending || mutation.isSuccess

  const { patient, transferAmount, currency } = transferDetails || {}

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} autoFocus={true}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Confirm Gift Recipient</DrawerTitle>
          <DrawerDescription>
            Confirm the gift recipient details
          </DrawerDescription>
        </DrawerHeader>

        <form
          className="flex flex-col text-center text-muted-foreground"
          onSubmit={async (e) => {
            e.preventDefault()
            await mutation.mutate()
          }}
        >
          <img
            src={giftBoxIcon}
            alt="Gift Box Icon"
            className="aspect-square p-2 object-contain w-full max-w-[100px] mx-auto"
            aria-hidden="true"
          />

          <h3 className="mt-5">Confirm Recepient</h3>

          <p className="font-medium text-lg">
            {formatMoney(transferAmount, currency)}
          </p>

          <p>discount will be transferred to </p>

          <p className="font-medium text-lg">{patient.name}</p>

          <DrawerFooter>
            <Button
              disabled={Boolean(buttonDisabled)}
              isLoading={mutation.isPending}
              type="submit"
            >
              Continue
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={() => mutation.reset()}
                disabled={Boolean(buttonDisabled)}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
