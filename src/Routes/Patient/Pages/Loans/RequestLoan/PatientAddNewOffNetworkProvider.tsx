import PatientPageWrapper from "../../PatientPageWrapper"
import { Controller } from "react-hook-form"
import FormGroupRadio from "@/components/FormGroupRadio"
import FormGroupInput from "@/components/form/FormGroupInput"
import { useMutation } from "@tanstack/react-query"
import { validatePhoneNumber } from "@/utilities/validators"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { mpesaBankCodeOptions } from "@/components/auth/mpesaDisbursalAccount"
import { useState } from "react"
import { Checkbox } from "@/components/Checkbox"
import { Button } from "@/components/Button"
import { useToast } from "@/hooks/useToast"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { usePersistentForm } from "@/hooks/usePersistentForm"

type Inputs = {
  name: string
  contactPhoneNumber: string
  address: string
  facilityType: "HOSPITAL" | "LAB" | "PHARMACY"
  bankCode: "MPESA" | "MPPAYBILL" | "MPTILL"
  accountNumber: string
  paybillAccountNumber: string
}

export default function PatientAddNewOffNetworkProvider() {
  const {
    handleSubmit,
    register,
    control,
    watch,
    formState: { errors },
  } = usePersistentForm<Inputs>("patientAddNewOffNetworkProvider")

  const [showPaybillNumber, setShowPaybillNumber] = useState(false)

  const accountNumberLabelName = () => {
    switch (watch("bankCode")) {
      case "MPESA":
        return {
          label: "Phone Number",
          placeholder: "Enter your phone number",
        }
      case "MPPAYBILL":
        return {
          label: "Paybill Number",
          placeholder: "Enter paybill number",
        }
      case "MPTILL":
        return {
          label: "Till Number",
          placeholder: "Enter till number",
        }
      default:
        return {
          label: "Account Number",
          placeholder: "Enter your account number",
        }
    }
  }

  const { toast } = useToast()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/add-new-off-network-provider`,
        data
      )

      return response.data
    },
    onSuccess: (data) => {
      navigate("/patients/payment/request-payment/treatment-details", {
        state: {
          careProviderName: data.name,
          careProviderId: data.id,
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

  return (
    <PatientPageWrapper title="Add Care Provider">
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(async (data) => await mutation.mutate(data))}
      >
        <Controller
          name="facilityType"
          control={control}
          rules={{ required: "Facility type is required" }}
          render={({
            field: { onChange, value, onBlur },
            fieldState: { error },
          }) => (
            <FormGroupRadio
              label="Who are you paying to?"
              name="facilityType"
              options={[
                { label: "Hospital", value: "HOSPITAL" },
                { label: "Lab", value: "LAB" },
                { label: "Pharmacy", value: "PHARMACY" },
              ]}
              error={error?.message}
              value={value} // Pass current value
              onChange={onChange} // Pass onChange handler
              onBlur={onBlur} // Optionally pass onBlur if needed
            />
          )}
        />

        <FormGroupInput
          id="name"
          label="Care Provider Name"
          type="text"
          placeholder="Name of care provider"
          register={register("name", {
            required: {
              value: true,
              message: "Please enter name of care provider",
            },
          })}
          error={errors.name?.message}
        />

        <FormGroupInput
          id="address"
          label="Care ProviderAddress"
          type="text"
          placeholder="Enter care provider address"
          register={register("address", {
            required: {
              value: true,
              message: "Please enter care provider address",
            },
            maxLength: {
              value: 300,
              message: "Address must be less than 300 characters",
            },
          })}
          error={errors.address?.message}
        />

        <FormGroupInput
          id="contactPhoneNumber"
          label="Care Provider Phone Number"
          type="text"
          placeholder="Enter care provider phone number"
          register={register("contactPhoneNumber", {
            required: {
              value: true,
              message: "Please enter care provider phone number",
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
          error={errors.contactPhoneNumber?.message}
        />

        <Controller
          name="bankCode"
          control={control}
          rules={{
            required: {
              value: true,
              message: "Please select MPESA Account Type",
            },
          }}
          render={({ field }) => (
            <FormGroupSelect
              id="bankCode"
              label=" MPESA Account Type"
              placeholder="Please select MPESA Account Type"
              field={field}
              error={errors.bankCode?.message}
              options={mpesaBankCodeOptions}
              defaultValue={control._defaultValues["bankCode"]}
            />
          )}
        />

        <FormGroupInput
          id="accountNumber"
          label={accountNumberLabelName().label}
          type="text"
          placeholder={accountNumberLabelName().placeholder}
          register={register("accountNumber", {
            required: {
              value: true,
              message: "Please enter your account number",
            },
            maxLength: {
              value: 25,
              message: "Account number must be less than 25 digits",
            },
          })}
          error={errors.accountNumber?.message}
        />

        {watch("bankCode") === "MPPAYBILL" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={showPaybillNumber}
              onCheckedChange={() => setShowPaybillNumber(!showPaybillNumber)}
            />
            <label
              htmlFor="terms"
              className="text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-left"
            >
              Should we collect a paybill account number?
            </label>
          </div>
        )}

        {watch("bankCode") === "MPPAYBILL" && showPaybillNumber && (
          <FormGroupInput
            id="paybillAccountNumber"
            label="Paybill Account Number"
            type="text"
            placeholder="Enter your paybill account number"
            register={register("paybillAccountNumber", {
              required: {
                value: true,
                message: "Please enter your paybill account number",
              },
              maxLength: {
                value: 25,
                message: "Account number must be less than 25 digits",
              },
            })}
            error={errors.paybillAccountNumber?.message}
          />
        )}

        {watch("bankCode") === "MPPAYBILL" && (
          <p className="bg-primary/20 rounded-xl py-2 px-2 font-medium text-sm text-center">
            {showPaybillNumber
              ? "We will use the account number provided above"
              : "We will use the patient's name as account number"}
          </p>
        )}

        <Button
          className="w-full"
          isLoading={mutation.isPending}
          disabled={mutation.isPending || mutation.isSuccess}
        >
          Pay to this provider
        </Button>
      </form>
    </PatientPageWrapper>
  )
}
