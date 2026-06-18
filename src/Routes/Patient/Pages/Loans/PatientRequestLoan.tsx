import { formatEnum } from "@/utilities/textUtilities"
import { useState } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Controller, useForm } from "react-hook-form"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { Button } from "@/components/Button"
import FormGroupInput from "@/components/form/FormGroupInput"
import { formatMoney } from "@/utilities/currencyUtilities"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import sparkle from "@/assets/icons/sparkle.svg"
import { Checkbox } from "@/components/Checkbox"
import { formatDate } from "@/utilities/dateUtilities"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog"
import PatientMedicalConsentForm from "../PatientMedicalConsentForm"
import { useToast } from "@/hooks/useToast"
import { Link, useNavigate } from "react-router-dom"
import AmountContainer from "../../components/AmountContainer"

const DEFAULT_TRANSACTION_FEE_PERCENTAGE = 2.9 // TODO: Replace this with dynamic value from backend
type Inputs = {
  recipient: string
  careProviderId: string
  totalBillAmount: number
  loanAmount: number
  careProviderName: string
  repaymentPeriodDays: number
}

type CurrentLoanApplicationStep =
  | "billing_information"
  | "payment_options"
  | "loan_terms"
  | "billing_summary"

const requestMedicalInfoFormDataQueryKey = "request-medical-info-form-data"
export default function PatientRequestLoan() {
  const [currentStep, setCurrentStep] = useState<CurrentLoanApplicationStep>(
    "billing_information"
  )

  const [billingDetails, setBillingDetails] = useState<Inputs>()

  function resolveCurrentStep() {
    switch (currentStep) {
      case "billing_information":
        return (
          <BillingInformation
            setCurrentStep={setCurrentStep}
            setBillingDetails={setBillingDetails}
          />
        )
      case "payment_options":
        return (
          <PaymentOptions
            billingDetails={billingDetails}
            setBillingDetails={setBillingDetails}
            setCurrentStep={setCurrentStep}
          />
        )
      case "loan_terms":
        return (
          <LoanTerms
            billingDetails={billingDetails}
            setBillingDetails={setBillingDetails}
            setCurrentStep={setCurrentStep}
          />
        )
      case "billing_summary":
        return <BillingSummary billingDetails={billingDetails} />

      default:
        return (
          <BillingInformation
            setCurrentStep={setCurrentStep}
            setBillingDetails={setBillingDetails}
          />
        )
    }
  }

  return (
    <PatientPageWrapper title={formatEnum(currentStep)}>
      {resolveCurrentStep()}
    </PatientPageWrapper>
  )
}

function BillingInformation({
  setCurrentStep,
  setBillingDetails,
}: {
  setCurrentStep: (step: CurrentLoanApplicationStep) => void
  setBillingDetails: (data: Inputs) => void
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const query = useQuery({
    queryKey: [requestMedicalInfoFormDataQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/request-medical-info-form-data`
      )
      return response.data
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const { careProviders } = query.data

  if (!careProviders) {
    return <ErrorBlock message="Failed to load care providers" />
  }

  return (
    <form
      className="flex flex-col gap-7 mt-5"
      onSubmit={handleSubmit((data: Inputs) => {
        const careProvider = careProviders.find(
          (careProvider: any) => careProvider.value === data.careProviderId
        )

        setBillingDetails({ ...data, careProviderName: careProvider.name })
        setCurrentStep("payment_options")
      })}
    >
      <p>
        We will collect the details of your medical bill and update you on your
        application status
      </p>

      <Controller
        name="careProviderId"
        control={control}
        rules={{ required: "Care Provider is required" }}
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

      <FormGroupInput
        id="totalBillAmount"
        label="Total Bill Amount"
        type="number"
        placeholder="Enter the total bill amount"
        register={register("totalBillAmount", {
          required: {
            value: true,
            message: "Please enter the total bill amount",
          },
        })}
        error={errors.totalBillAmount?.message}
      />
      <Controller
        name="recipient"
        control={control}
        rules={{ required: "Patient is required" }}
        render={({ field }) => (
          <FormGroupSelect
            id="recipient"
            label="Who is the patient?"
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

      <Button>Continue</Button>
    </form>
  )
}

function PaymentOptions({
  billingDetails,
  setCurrentStep,
  setBillingDetails,
}: {
  billingDetails?: Inputs
  setCurrentStep: (step: CurrentLoanApplicationStep) => void
  setBillingDetails: (data: Inputs) => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      loanAmount: 0,
    },
  })

  const user = usePatientAuthStore((state: any) => state.user)
  const { creditLimit } = user || {}

  const { remainingAmount } = creditLimit || {}

  const displayedTotalCreditLimitAmount = Math.max(
    0,
    Number(remainingAmount ?? 0)
  )

  if (!billingDetails) {
    return <ErrorBlock message="Failed to load billing details" />
  }

  return (
    <>
      <p>Please indicate how you would like to pay for your bill</p>

      <p className="text-center font-medium bg-primary/10 rounded-lg px-3 py-2">
        Total Bill Amount: {formatMoney(billingDetails.totalBillAmount, "KES")}
      </p>

      <form
        className="flex flex-col gap-7 mt-5"
        onSubmit={handleSubmit((data: Inputs) => {
          setCurrentStep("loan_terms")
          setBillingDetails({ ...billingDetails, loanAmount: data.loanAmount })
        })}
      >
        <FormGroupInput
          id="loanAmount"
          label="Enter Loan Amount"
          type="number"
          placeholder="Enter the loan amount"
          register={register("loanAmount", {
            required: {
              value: true,
              message: "Please enter the loan amount",
            },
            min: {
              value: 100,
              message: "Loan amount must be greater than 100",
            },
            max: {
              value: Math.min(
                billingDetails.totalBillAmount,
                displayedTotalCreditLimitAmount
              ),
              message: `Loan amount cannot exceed ${displayedTotalCreditLimitAmount > billingDetails.totalBillAmount ? "total bill amount" : "credit limit amount"} (${formatMoney(
                Math.min(
                  billingDetails.totalBillAmount,
                  displayedTotalCreditLimitAmount
                ),
                "KES"
              )})`,
            },
          })}
          error={errors.loanAmount?.message}
        />
        <p className="flex items-center gap-2 text-sm mb-5">
          <img
            src={sparkle}
            alt="sparkle"
            className="w-3 h-3"
            aria-hidden="true"
          />
          Max credit limit amount{" "}
          {formatMoney(displayedTotalCreditLimitAmount, "KES")}
        </p>
        <AmountContainer
          leftText={`Loan Amount`}
          rightText={formatMoney(watch("loanAmount") || 0, "KES")}
        />
        <AmountContainer
          leftText={`${user?.firstName} ${user?.lastName} pays`}
          rightText={formatMoney(
            billingDetails.totalBillAmount - (watch("loanAmount") ?? 0),
            "KES"
          )}
        />
        <div className="h-1 w-full border-b" aria-hidden="true"></div>
        <div className="bg-neutral-100 p-3 rounded-lg">
          <AmountContainer
            leftText="Total Bill"
            rightText={formatMoney(billingDetails.totalBillAmount, "KES")}
          />
        </div>
        <div className="h-1 w-full border-b" aria-hidden="true"></div>
        <div className="bg-primary/10 p-3 rounded-lg">
          <AmountContainer
            leftText="Transaction Fee Payable"
            rightText={formatMoney(
              watch("loanAmount") * (DEFAULT_TRANSACTION_FEE_PERCENTAGE / 100),
              "KES"
            )}
          />
        </div>
        <Button className="mt-5">Continue</Button>
      </form>
    </>
  )
}

//TODO: Replace this with dynamic value from backend
const DEFAULT_LATE_FEE_PERCENTAGE = 9
const DEFAULT_INTEREST_RATE_PERCENTAGE = 2.5

function LoanTerms({
  billingDetails,
  setCurrentStep,
  setBillingDetails,
}: {
  billingDetails?: Inputs
  setCurrentStep: (step: CurrentLoanApplicationStep) => void
  setBillingDetails: (data: Inputs) => void
}) {
  const [hasAcceptedTermsAndConditions, setHasAcceptedTermsAndConditions] =
    useState(false)

  const user = usePatientAuthStore((state: any) => state.user)

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<Inputs>()

  if (!billingDetails) {
    return <ErrorBlock message="Failed to load billing details" />
  }

  const transactionFee =
    billingDetails.loanAmount * (DEFAULT_TRANSACTION_FEE_PERCENTAGE / 100)

  //Create date by watching the repayment period days and adding them to current date
  const repaymentPeriodDays = Number(watch("repaymentPeriodDays")) || 0

  const currentDate = new Date()
  const repaymentDate = currentDate.setDate(
    currentDate.getDate() + repaymentPeriodDays
  )

  const interestAmount = resolveInterestRate(
    billingDetails.loanAmount,
    repaymentPeriodDays
  )

  const lateFee =
    Number(billingDetails.loanAmount) * (DEFAULT_LATE_FEE_PERCENTAGE / 100)

  return (
    <form
      className="flex flex-col gap-7 mt-5"
      onSubmit={handleSubmit((data: Inputs) => {
        setCurrentStep("billing_summary")
        setBillingDetails({
          ...billingDetails,
          repaymentPeriodDays: data.repaymentPeriodDays,
        })
      })}
    >
      <p>Please review and accept the loan terms</p>

      <AmountContainer
        leftText="Loan Amount:"
        leftClassName="font-medium"
        rightText={formatMoney(billingDetails.loanAmount ?? 0, "KES")}
        rightClassName="text-primary"
      />

      <Controller
        name="repaymentPeriodDays"
        control={control}
        rules={{ required: "Repayment period is required" }}
        render={({ field }) => (
          <FormGroupSelect
            id="repaymentPeriodDays"
            label="Choose your repayment period"
            placeholder="Select repayment period"
            field={field}
            error={errors.repaymentPeriodDays?.message}
            options={resolveRepaymentPeriodOptions(
              billingDetails.loanAmount ?? 0
            )}
          />
        )}
      />

      <section className="flex flex-col gap-3">
        <h3 className="font-medium pb-1 border-b">
          Review loan summary and fees
        </h3>
        <AmountContainer
          leftText="Loan Amount:"
          rightText={formatMoney(billingDetails.loanAmount ?? 0, "KES")}
        />
        <AmountContainer
          leftText="Repayment Date:"
          rightText={repaymentPeriodDays ? formatDate(repaymentDate) : "-"}
        />
        <AmountContainer
          leftText="Interest Amount:"
          rightText={formatMoney(interestAmount, "KES")}
        />
      </section>

      <div
        className="h-1 w-full border-b border-black"
        aria-hidden="true"
      ></div>

      <section className="flex flex-col gap-3">
        <AmountContainer
          leftText="Total Amount to repay:"
          rightText={formatMoney(
            Number(billingDetails.loanAmount) + Number(interestAmount),
            "KES"
          )}
        />
        <AmountContainer
          leftText="Transaction Fee:"
          rightText={formatMoney(transactionFee, "KES")}
        />

        <p className="flex text-red-500 mt-3 items-center gap-2 text-sm">
          <img
            src={sparkle}
            alt="sparkle"
            className="w-3 h-3"
            aria-hidden="true"
          />
          If your loan payment is delayed, there will be a penalty fee of{" "}
          {formatMoney(lateFee, "KES")}
        </p>
      </section>

      <div className="flex space-x-2 sm:col-span-2 mt-3">
        <Checkbox
          id="terms"
          checked={hasAcceptedTermsAndConditions}
          onCheckedChange={() =>
            setHasAcceptedTermsAndConditions(!hasAcceptedTermsAndConditions)
          }
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          By ticking this box, you confirm that you have read and agree to the{" "}
          <Link to="/patients/terms-and-conditions" target="_blank">
            Terms and Conditions
          </Link>
        </label>
      </div>

      {user.hasAcceptedMedicalConsentForm ? (
        <Button>Proceed to payment</Button>
      ) : (
        <ConsentFormDialog billingDetails={billingDetails} />
      )}
    </form>
  )
}

function resolveRepaymentPeriodOptions(loanAmount: number) {
  const repaymentPeriodOptions = [
    { value: "14", name: "2 Weeks - Interest Free!" },
    { value: "31", name: "31 days" },
    { value: "61", name: "61 days" },
  ]

  if (loanAmount <= 1000) {
    return repaymentPeriodOptions.filter((option) => Number(option.value) <= 14)
  }

  if (loanAmount <= 4000) {
    return repaymentPeriodOptions.filter((option) => Number(option.value) <= 31)
  }

  return repaymentPeriodOptions
}

function resolveInterestRate(loanAmount: number, repaymentPeriodDays: number) {
  if (repaymentPeriodDays <= 14) {
    return 0
  }

  //convert days to months
  const repaymentPeriodMonths = Math.floor(repaymentPeriodDays / 30)

  //interest amount
  const interestAmount =
    loanAmount *
    repaymentPeriodMonths *
    (DEFAULT_INTEREST_RATE_PERCENTAGE / 100)

  return interestAmount
}

function ConsentFormDialog({ billingDetails }: { billingDetails: Inputs }) {
  const [hasAcceptedConsentForm, setHasAcceptedConsentForm] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // Track dialog state
  const { toast } = useToast()
  const user = usePatientAuthStore((state: any) => state.user)
  const setUser = usePatientAuthStore((state: any) => state.setUser)

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/accept-medical-consent-form`,
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
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Consent form has been accepted successfully",
      })
      setUser({ ...user, hasAcceptedMedicalConsentForm: true })
      setIsOpen(false) // Close the dialog
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>View Consent Form</Button>
      </DialogTrigger>

      <DialogContent className=" max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Medical Consent Form</DialogTitle>
          <DialogDescription>
            Please read and agree to the below data consent form.
          </DialogDescription>
        </DialogHeader>
        <PatientMedicalConsentForm />

        <div className="flex space-x-2 mt-5">
          <Checkbox
            id="has agreed to  loanTerms"
            checked={hasAcceptedConsentForm}
            onCheckedChange={() =>
              setHasAcceptedConsentForm(!hasAcceptedConsentForm)
            }
            className="mt-1"
          />
          <label
            htmlFor="terms"
            className="text-sm text-neutral-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            By ticking the box, I give my consent for Jireh Innovations Limited
            to collect, use, store, and share my personal and medical data for
            the purpose of providing healthcare financing services.
          </label>
        </div>
        <DialogFooter className="flex flex-col gap-3 ">
          <Button
            className="w-full"
            onClick={() => {
              mutation.mutate(billingDetails)
            }}
            isLoading={mutation.isPending}
            disabled={mutation.isPending || !hasAcceptedConsentForm}
          >
            Accept Consent Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BillingSummary({ billingDetails }: { billingDetails?: Inputs }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user)

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/loans/patient/apply-for-loan`,
        billingDetails
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
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan application submitted successfully",
      })
      navigate("/patients/loans/loan-application-success")
    },
  })

  const { handleSubmit } = useForm<Inputs>()

  if (!billingDetails) {
    return <ErrorBlock message="Failed to load billing details" />
  }

  if (!user) {
    return <ErrorBlock message="Failed to load user" />
  }

  const payRest = billingDetails.totalBillAmount - billingDetails.loanAmount

  const transactionFee =
    billingDetails.loanAmount * (DEFAULT_TRANSACTION_FEE_PERCENTAGE / 100)
  return (
    <form
      className="flex flex-col gap-7  uppercase"
      onSubmit={handleSubmit(async () => {
        await mutation.mutateAsync()
      })}
    >
      <AmountContainer
        leftText="Total Bill:"
        rightText={formatMoney(billingDetails.totalBillAmount, "KES")}
      />
      <AmountContainer
        leftText="Jireh Pays:"
        rightText={formatMoney(billingDetails.loanAmount ?? 0, "KES")}
      />

      <div
        className="h-1 w-full border-b border-black"
        aria-hidden="true"
      ></div>
      <AmountContainer
        leftText="Transaction Fee:"
        rightText={formatMoney(transactionFee, "KES")}
      />

      <AmountContainer
        leftText={`${user?.firstName} ${user?.lastName} Pays:`}
        rightText={formatMoney(payRest + transactionFee, "KES")}
      />

      <div
        className="h-1 w-full border-b border-black"
        aria-hidden="true"
      ></div>

      <AmountContainer
        leftText="Total Amount:"
        leftClassName="text-primary  font-bold"
        rightText={formatMoney(payRest + transactionFee, "KES")}
      />

      <Button isLoading={mutation.isPending} disabled={mutation.isPending}>
        Pay Bill
      </Button>
    </form>
  )
}
