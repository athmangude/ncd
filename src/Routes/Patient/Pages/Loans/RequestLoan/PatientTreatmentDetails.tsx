import PatientPageWrapper from "../../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import { useLocation, useNavigate } from "react-router-dom"
import { Phone, ChevronRight } from "lucide-react"
import { DetailsNotSet } from "@/Routes/Patient/components/DetailsNotSet"
import SearchField from "@/components/SearchField"
import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import careProviderIcon from "@/assets/icons/care-provider.png"
import { useEffect, useState } from "react"
import { trackEvent, EVENTS } from "@/analytics"
import FormGroupInput from "@/components/form/FormGroupInput"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import { validatePhoneNumber } from "@/utilities/validators"
import { Controller } from "react-hook-form"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import {
  accountNumberLabelName,
  mpesaBankCodeOptions,
} from "@/components/auth/mpesaDisbursalAccount"
import { Switch } from "@/components/Switch"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/utilities/localStorage"
import { Button } from "@/components/Button"
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
import AmountContainer from "@/Routes/Patient/components/AmountContainer"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"

export const patientTreatmentDetailsStorageKey = "patientTreatmentDetails"

export default function PatientTreatmentDetails() {
  const location = useLocation()
  const state = location.state

  if (!state?.patient.name || !state?.patient.id) {
    return (
      <DetailsNotSet title="It looks like you have not selected a patient" />
    )
  }

  return (
    <PatientPageWrapper
      variant="content"
      headerIcon={<img src={careProviderIcon} alt="" className={HEADER_ICON} />}
      pageTitle="Where are you receiving treatment?"
    >
      <TreatmentDetailsForm />
    </PatientPageWrapper>
  )
}

function TreatmentDetailsForm() {
  const [careProvider, setCareProvider] = useState<any>(null)

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.PAYMENT.TREATMENT_DETAILS_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    const reviewInvoiceData = getFromLocalStorage(
      patientReviewInvoiceStorageKey
    )

    if (reviewInvoiceData?.kmpdcFacility) {
      setCareProvider(reviewInvoiceData.kmpdcFacility)
      return
    }

    const storedCareProvider = localStorage.getItem(
      patientTreatmentDetailsStorageKey
    )

    if (storedCareProvider) {
      setCareProvider(JSON.parse(storedCareProvider))
    }
  }, [])

  return (
    <div className="flex flex-col gap-7">
      <SearchField
        searchUrl="/patients/search-facilities"
        dataDetails={{
          titleKey: "name",
          descriptionKey: "plotNumber",
          dataKey: "facilities",
        }}
        onResultSelect={(result) => {
          try {
            trackEvent(EVENTS.PAYMENT.TREATMENT_DETAILS_PROVIDER_SELECT, {
              providerName: result?.name,
              isOnNetwork:
                result?.facility?.facilityVerificationStatus === "APPROVED",
            })
          } catch {
            // Silent fail
          }
          setCareProvider(result)
          const reviewInvoiceData =
            getFromLocalStorage(patientReviewInvoiceStorageKey) || {}

          let paymentInfo
          if (result.paymentInfo) {
            if (result.paymentInfo.type === "MPTILL") {
              paymentInfo = {
                "payment-type": "MPTILL",
                "till-number": result.paymentInfo.tillNumber,
                source: "invoice_payment_info",
              }
            } else if (
              result.paymentInfo.type === "MPPAYBILL" ||
              result.paymentInfo.type === "MPAYBILL"
            ) {
              paymentInfo = {
                "payment-type": "MPPAYBILL",
                "business-number":
                  result.paymentInfo.businessNumber ||
                  result.paymentInfo.paybillNumber,
                "account-number": result.paymentInfo.accountNumber,
                source: "invoice_payment_info",
              }
            }
          }

          setToLocalStorage(patientReviewInvoiceStorageKey, {
            ...reviewInvoiceData,
            kmpdcFacility: result,
            hasVerifiedRecipientAccount: false,
            paymentRecipientAccount: undefined,
            paymentInfo,
          })
        }}
        placeholder="Type to search for a care provider"
        emphasis={{
          key: "facility",
          text: "Earn cashback here with Jireh",
          condition: (result) =>
            result.facility?.facilityVerificationStatus === "APPROVED",
        }}
      />

      {/* Show only if care provider is selected and does not have an on network facility */}
      {resolveComponent(careProvider)}
    </div>
  )
}

const resolveComponent = (careProvider: any) => {
  if (!careProvider) {
    return null
  }

  if (careProvider?.facility?.facilityVerificationStatus === "APPROVED") {
    return (
      <OnNetworkFacilityForm
        key={careProvider.id}
        careProvider={careProvider}
      />
    )
  }

  if (careProvider?.oonFacility?.hasVerifiedRecipientAccount) {
    return (
      <OnNetworkFacilityForm
        key={careProvider.id}
        careProvider={careProvider}
      />
    )
  }

  return (
    <OutOfNetworkFacilityForm
      key={careProvider.id}
      careProvider={careProvider}
    />
  )
}

type Inputs = {
  contactPhoneNumber: string
  bankCode: "MPESA" | "MPPAYBILL" | "MPTILL"
  accountNumber: string
  paybillAccountNumber: string
  kmpdcFacilityId: string
}
const outOfNetworkProviderFormStorageKey = "outOfNetworkProviderForm"
function OutOfNetworkFacilityForm({ careProvider }: { careProvider: any }) {
  const location = useLocation()
  const state = location.state

  const [showPaybillNumber, setShowPaybillNumber] = useState(true)

  const {
    register,
    control,
    watch,
    handleSubmit,
    resetField,
    setValue,
    reset,
    formState: { errors },
  } = usePersistentForm<Inputs>(outOfNetworkProviderFormStorageKey)

  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    const reviewInvoiceData = getFromLocalStorage(
      patientReviewInvoiceStorageKey
    )
    const paymentInfo = reviewInvoiceData?.paymentInfo

    if (paymentInfo) {
      const paymentType = paymentInfo["payment-type"]
      if (paymentType === "MPTILL") {
        setValue("bankCode", "MPTILL")
        setValue("accountNumber", paymentInfo["till-number"])
      } else if (paymentType === "MPAYBILL" || paymentType === "MPPAYBILL") {
        setValue("bankCode", "MPPAYBILL")
        setValue("accountNumber", paymentInfo["business-number"])
        setValue("paybillAccountNumber", paymentInfo["account-number"])
        if (paymentInfo["account-number"]) {
          setShowPaybillNumber(true)
        }
      }
    } else {
      reset()
      setValue("bankCode", "" as any)
      setValue("accountNumber", "")
      setValue("paybillAccountNumber", "")
      setValue("contactPhoneNumber", "")
    }
  }, [setValue, reset])

  useEffect(() => {
    const subscription = watch((value) => {
      const reviewInvoiceData =
        getFromLocalStorage(patientReviewInvoiceStorageKey) || {}

      let paymentInfo = reviewInvoiceData["paymentInfo"] || {}

      if (value.bankCode === "MPTILL") {
        paymentInfo = {
          "payment-type": "MPTILL",
          "till-number": value.accountNumber,
          source: "invoice_payment_info",
        }
      } else if (value.bankCode === "MPPAYBILL") {
        paymentInfo = {
          "payment-type": "MPPAYBILL",
          "business-number": value.accountNumber || value.paybillAccountNumber,
          "account-number": value.paybillAccountNumber,
          source: "invoice_payment_info",
        }
      }

      setToLocalStorage(patientReviewInvoiceStorageKey, {
        ...reviewInvoiceData,
        paymentInfo: paymentInfo,
      })
    })
    return () => subscription.unsubscribe()
  }, [watch])

  async function mutationFn(data: Inputs) {
    const response = await axios.post(
      `${
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
      }/patients/add-new-off-network-provider`,
      data
    )

    return response.data
  }

  const { name, plotNumber, id, county } = careProvider || {}

  const watchedBankCode = watch("bankCode")
  useEffect(() => {
    resetField("paybillAccountNumber")
  }, [watchedBankCode, resetField])

  return (
    <form
      className="w-full flex flex-col gap-7 mt-3"
      onSubmit={handleSubmit((_) => {
        setShowDrawer(true)
      })}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{name}</h2>
        <p className="text-sm text-neutral-500">
          {county} • {plotNumber}
        </p>
      </div>

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
      {watch("bankCode") && (
        <FormGroupInput
          id="accountNumber"
          label={accountNumberLabelName(watch("bankCode")).label}
          type="text"
          placeholder={accountNumberLabelName(watch("bankCode")).placeholder}
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
      )}

      {watch("bankCode") === "MPPAYBILL" && (
        <div className="flex items-center space-x-2">
          <Switch
            checked={showPaybillNumber}
            onCheckedChange={() => setShowPaybillNumber(!showPaybillNumber)}
            id="switch-paybill-account-number"
          />
          <label
            htmlFor="terms"
            className="text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-left"
          >
            {showPaybillNumber
              ? "Use patient name as account number?"
              : "Provide a Paybill account number?"}
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
            : `We will set ${state.patient.name} as the paybill account number`}
        </p>
      )}

      <ConfirmCareProviderDetailsDrawer
        isOpen={showDrawer}
        onOpenChange={setShowDrawer}
        careProviderName={name}
        kmpdcFacilityId={id}
        facilityLocation={`${county} • ${plotNumber}`}
        phoneNumber={watch("contactPhoneNumber")}
        bankCode={watch("bankCode")}
        accountNumber={watch("accountNumber")}
        paybillAccountNumber={
          showPaybillNumber ? watch("paybillAccountNumber") : state.patient.name
        }
        mutationFn={mutationFn}
        careProvider={careProvider}
      />
    </form>
  )
}

export const patientTreatmentDetailsQueryKey = "patientTreatmentDetails"

function OnNetworkFacilityForm({ careProvider }: { careProvider: any }) {
  const location = useLocation()
  const state = location.state

  const [showDrawer, setShowDrawer] = useState(false)

  function mutationFn(data: any) {
    return data
  }

  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.resetQueries({
      queryKey: [patientTreatmentDetailsQueryKey],
      exact: true,
    })
  }, [careProvider, queryClient])

  const query = useQuery({
    queryKey: [patientTreatmentDetailsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          `/patients/facility-details?facilityId=${careProvider.id}`
      )

      return response.data
    },
  })

  useEffect(() => {
    if (query.data?.recipientAccount) {
      const reviewInvoiceData =
        getFromLocalStorage(patientReviewInvoiceStorageKey) || {}

      const { bankCode, accountNumber, paybillAccountNumber } =
        query.data.recipientAccount

      let paymentInfo = {}

      if (bankCode === "MPTILL") {
        paymentInfo = {
          source: "verified_account",
          "payment-type": "MPTILL",
          "till-number": accountNumber,
        }
      } else if (bankCode === "MPPAYBILL" || bankCode === "MPAYBILL") {
        paymentInfo = {
          source: "verified_account",
          "payment-type": "MPPAYBILL",
          "business-number": accountNumber,
          "account-number": paybillAccountNumber || state?.patient?.name,
        }
      }

      setToLocalStorage(patientReviewInvoiceStorageKey, {
        ...reviewInvoiceData,
        hasVerifiedRecipientAccount: true,
        recipientAccount: query.data.recipientAccount,
        paymentInfo,
      })
    }
  }, [query.data, state?.patient?.name])

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock message={query.error.message} />
  }

  const { name, plotNumber, id, county } = careProvider || {}

  const { accountNumber, bankCode, paybillAccountNumber } =
    query.data?.recipientAccount || {}

  return (
    <form
      className="w-full flex flex-col gap-7 mt-3"
      onSubmit={(e) => {
        e.preventDefault()
        setShowDrawer(true)
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{name}</h2>
        <p className="text-sm text-neutral-500">
          {county} • {plotNumber}
        </p>
      </div>

      {accountNumber && (
        <AmountContainer
          leftText={accountNumberLabelName(bankCode as any).label}
          rightText={accountNumber}
        />
      )}

      {paybillAccountNumber && (
        <AmountContainer
          leftText="Paybill Account Number:"
          rightText={paybillAccountNumber}
        />
      )}

      <ConfirmCareProviderDetailsDrawer
        isOpen={showDrawer}
        onOpenChange={setShowDrawer}
        careProviderName={name}
        kmpdcFacilityId={id}
        facilityLocation={`${county} • ${plotNumber}`}
        mutationFn={mutationFn}
        accountNumber={accountNumber}
        bankCode={bankCode}
        paybillAccountNumber={
          paybillAccountNumber ? paybillAccountNumber : state.patient.name
        }
        careProvider={careProvider}
      />

      <div className="w-full mt-6 pt-6 border-t">
        <h3 className="font-medium text-neutral-900 mb-1">
          Can’t find your care provider?
        </h3>
        <p className="text-sm text-neutral-500 mb-3">
          Contact our support team
        </p>
        <a
          href="tel:+254117118511"
          className="flex items-center justify-between p-3 bg-white border rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-900">
              Call Jireh Support
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </a>
      </div>
    </form>
  )
}

function ConfirmCareProviderDetailsDrawer({
  isOpen,
  onOpenChange,
  careProviderName,
  kmpdcFacilityId,
  facilityLocation,
  phoneNumber,
  bankCode,
  accountNumber,
  paybillAccountNumber,
  mutationFn,
  careProvider,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  careProviderName: string
  kmpdcFacilityId: string
  facilityLocation?: string
  phoneNumber?: string
  bankCode?: string
  accountNumber: string
  paybillAccountNumber?: string
  mutationFn: (data: any) => Promise<any>
  careProvider: any
}) {
  const { toast } = useToast()
  const navigate = useNavigate()

  const location = useLocation()
  const state = location.state

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await mutationFn(data)
      return response
    },
    onSuccess: () => {
      localStorage.setItem(
        patientTreatmentDetailsStorageKey,
        JSON.stringify(careProvider)
      )
      navigate("/patients/payment/request-payment/review-invoice", {
        state: {
          ...state,
          careProvider: {
            name: careProviderName,
            id: kmpdcFacilityId,
          },
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
    <Drawer open={isOpen} onOpenChange={onOpenChange} autoFocus={true}>
      <Button>Continue</Button>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Confirm Care Provider Details</DrawerTitle>
          <DrawerDescription className="sr-only">
            Please confirm the care provider details before proceeding.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4  flex flex-col gap-1">
          <AmountContainer leftText="Name:" rightText={careProviderName} />
          {facilityLocation && (
            <AmountContainer
              leftText="Location:"
              rightText={facilityLocation}
            />
          )}

          {phoneNumber && (
            <AmountContainer leftText="Phone Number:" rightText={phoneNumber} />
          )}

          {accountNumber && (
            <AmountContainer
              leftText={accountNumberLabelName(bankCode as any).label}
              rightText={accountNumber}
            />
          )}

          {paybillAccountNumber && (
            <AmountContainer
              leftText="Paybill Account Number:"
              rightText={paybillAccountNumber}
            />
          )}
        </div>

        <DrawerFooter>
          <Button
            type="button"
            disabled={mutation.isPending || mutation.isSuccess}
            isLoading={mutation.isPending}
            onClick={(e) => {
              e.preventDefault()
              mutation.mutate({
                kmpdcFacilityId,
                careProviderName,
                contactPhoneNumber: phoneNumber,
                bankCode,
                accountNumber,
              })
            }}
          >
            Details Are Correct
          </Button>

          <DrawerClose asChild>
            <Button
              variant="outline"
              onClick={() => mutation.reset()}
              disabled={mutation.isPending || mutation.isSuccess}
            >
              Edit Details
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
