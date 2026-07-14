import PatientPageWrapper from "../../PatientPageWrapper"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import { Controller } from "react-hook-form"
import FormGroupInput from "@/components/form/FormGroupInput"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import AmountContainer from "@/Routes/Patient/components/AmountContainer"
import { formatMoney } from "@/utilities/currencyUtilities"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { formatDate } from "@/utilities/dateUtilities"
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
import cash from "@/assets/icons/cash.png"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { Checkbox } from "@/components/Checkbox"
import {
  usePersistentForm,
  clearPeristentForm,
} from "@/hooks/usePersistentForm"
import { DetailsNotSet } from "@/Routes/Patient/components/DetailsNotSet"
import { RepaymentTimeline } from "@/Routes/Patient/components/RepaymentTimeline"
import useNextLoanApplicationStep from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import { patientLoginDetailsQueryKey } from "../../PatientsHome"
import { patientSelectStorageKey } from "./PatientSelectPatient"
import { patientSetBillAmountStorageKey } from "./PatientSetBillAmount"
import { patientTreatmentDetailsStorageKey } from "./PatientTreatmentDetails"
import {
  resolveInterestRate,
  resolveMaxLoanAmount,
  resolveOrgRepaymentPeriodOptions,
  resolvePublicRepaymentPeriodOptions,
  resolveSubmitButtonText,
  resolveYouPayTodayAmount,
} from "@/Routes/Patient/utilities/loanTermUtilities"
import {
  DEFAULT_LATE_FEE_PERCENTAGE,
  DEFAULT_TRANSACTION_FEE_PERCENTAGE,
} from "@/Routes/Patient/constants/loantTermConstants"
import { addMonths, isBefore, lastDayOfMonth, setDate } from "date-fns"
import { ProtectedResource } from "@/components/ProtectedResource"
import { MEMBER_LOAN_ROLES } from "@/Routes/Patient/constants/userTypes"

type Inputs = {
  loanAmount: number
  repaymentPeriodDays: number
  acceptedMedicalConsent: boolean
  acceptedTerms: boolean
  totalBillAmount: number
}

export default function PatientLoanTerms() {
  const location = useLocation()
  const data = location.state

  const billDetailsPresent = () => {
    if (!data) {
      return false
    }

    if (!data.careProvider) {
      return false
    }

    if (!data.patient) {
      return false
    }

    if (!data.fileId) {
      return false
    }

    if (!data.totalBillAmount) {
      return false
    }

    return true
  }

  return (
    <PatientPageWrapper title="Loan Terms">
      {billDetailsPresent() ? (
        <LoanTermsForm
          careProviderId={data!.careProvider!.id}
          careProviderName={data!.careProvider!.name}
          patientName={data!.patient!.name}
          patientId={data!.patient!.id}
          fileId={data!.fileId!}
          totalBillAmount={Number(data!.totalBillAmount)}
          careFundDiscountAmount={Number(data!.careFundDiscountAmount || 0)}
        />
      ) : (
        <DetailsNotSet title="It looks like your treatment details have not been set" />
      )}
    </PatientPageWrapper>
  )
}

export const patientLoanTermsStorageKey = "patientLoanTerms"

function LoanTermsForm({
  careProviderId,
  careProviderName,
  patientName,
  patientId,
  fileId,
  totalBillAmount,
  careFundDiscountAmount,
}: {
  careProviderId: string
  careProviderName: string
  patientName: string
  patientId: string
  fileId: string
  totalBillAmount: number
  careFundDiscountAmount: number
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = usePersistentForm<Inputs>(patientLoanTermsStorageKey, {
    // String "31" so the select matches the option value and shows "31 days" as selected
    defaultValues: { repaymentPeriodDays: "31" as unknown as number },
  })

  const user = usePatientAuthStore((state: any) => state.user)

  const remainingCreditLimitAmount = Number(
    user?.creditLimit?.remainingAmount || 0
  )
  const newBillAmount = totalBillAmount - careFundDiscountAmount

  const maxLoanAmount = resolveMaxLoanAmount({
    remainingCreditLimitAmount,
    newBillAmount,
    patientType: user.type,
    maxMonthlyDeductibleAmount:
      user.orgBorrower?.creditSettings?.maxMonthlyDeductibleAmount || 0,
    maxLoanDurationPeriodMonths:
      user.orgBorrower?.creditSettings?.maxLoanDurationPeriodMonths || 0,
  })

  const repaymentPeriodDays = Number(watch("repaymentPeriodDays")) || 0
  const currentDate = new Date()
  const repaymentDate = currentDate.setDate(
    currentDate.getDate() + repaymentPeriodDays
  )

  const loanAmount = Number(watch("loanAmount"))

  const interestAmount = resolveInterestRate(loanAmount, repaymentPeriodDays)

  const lateFee = loanAmount * (DEFAULT_LATE_FEE_PERCENTAGE / 100)

  const transactionFee = Math.ceil(
    loanAmount * (DEFAULT_TRANSACTION_FEE_PERCENTAGE / 100)
  )
  const [isOpen, setIsOpen] = useState(false)

  const { toast } = useToast()

  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedMedicalConsent, setAcceptedMedicalConsent] = useState(false)

  const navigate = useNavigate()
  const next = useNextLoanApplicationStep()

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (loanAmount > totalBillAmount) {
        throw new Error("Loan amount exceeds the total bill amount")
      }

      if (loanAmount > maxLoanAmount) {
        throw new Error("Loan amount exceeds the maximum allowed")
      }

      //Accept latest terms and conditions
      if (!user.hasAcceptedLatestTermsAndConditions) {
        if (!acceptedTerms) {
          throw new Error("You must accept the latest terms and conditions")
        }

        await axios.post(
          `${
            import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
          }/patients/accept-terms-and-conditions`
        )
      }

      if (!user.hasAcceptedMedicalConsentForm) {
        if (!acceptedMedicalConsent) {
          throw new Error("You must accept the medical consent form")
        }

        await axios.post(
          `${
            import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
          }/patients/accept-medical-consent-form`
        )
      }

      const body = {
        careProviderId,
        totalBillAmount,
        loanAmount,
        repaymentPeriodDays,
        patientId,
        patientName,
        careFundDiscountAmount,
      }
      const result = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/loans/patient/apply-for-loan",
        {
          ...body,
          fileId,
        }
      )

      return result.data
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: [patientLoginDetailsQueryKey],
      })

      //Clear persistent form states
      clearPeristentForm([
        patientSelectStorageKey,
        patientLoanTermsStorageKey,
        patientSetBillAmountStorageKey,
        patientTreatmentDetailsStorageKey,
      ])

      toast({
        title: "Success",
        description:
          "Loan application successful. You will be redirected shortly",
      })

      //Redirect if there is a payment to be made
      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl)
        return
      }

      //Redirect to payment success page if there is no payment to be made
      navigate(`${next}/${data.loanId}`)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const buttonDisabled = (() => {
    if (!user.hasAcceptedLatestTermsAndConditions && !acceptedTerms) {
      return true
    }

    if (!user.hasAcceptedMedicalConsentForm && !acceptedMedicalConsent) {
      return true
    }

    return false
  })()

  const dueLaterAmount = Math.min(newBillAmount, loanAmount)

  const youPayTodayAmount = resolveYouPayTodayAmount({
    totalBillAmount,
    loanAmount,
    careFundDiscountAmount,
    transactionFee,
    patientType: user.type,
  })

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit(() => {
        setIsOpen(true)
      })}
    >
      <FormGroupInput
        id="loanAmount"
        label="Loan Amount"
        type="number"
        placeholder="Enter the loan amount"
        register={register("loanAmount", {
          required: {
            value: true,
            message: "Please enter the loan amount",
          },
          min: {
            value: 100,
            message: "Loan amount must be greater than KES 100",
          },
          max: {
            value: maxLoanAmount,
            message: `Loan amount cannot exceed KES ${maxLoanAmount} `,
          },
        })}
        error={errors.loanAmount?.message}
        description={totalBillAmount ? `Max: KES ${maxLoanAmount}` : ""}
      />

      <RepaymentPeriodInput
        control={control}
        errors={errors}
        loanAmount={watch("loanAmount")}
        totalBillAmount={totalBillAmount}
        repaymentPeriodDays={repaymentPeriodDays}
      />

      <div
        className="h-1 w-full border-b border-black my-3"
        aria-hidden="true"
      ></div>

      <AmountContainer leftText="Patient Name:" rightText={patientName} />

      <AmountContainer
        leftText="Loan Amount:"
        rightText={formatMoney(loanAmount, "KES")}
      />

      <ProtectedResource userRole={user.type} allowedRoles={MEMBER_LOAN_ROLES}>
        <>
          <AmountContainer
            leftText="Interest Amount:"
            rightText={formatMoney(interestAmount, "KES")}
          />

          <AmountContainer
            leftText="Transaction Fee:"
            rightText={formatMoney(transactionFee, "KES")}
          />
        </>
      </ProtectedResource>

      <AmountContainer
        leftText="Due Date:"
        rightText={repaymentPeriodDays ? formatDate(repaymentDate) : "-"}
      />

      <section className="flex flex-col gap-3 mt-3">
        {!user.hasAcceptedLatestTermsAndConditions && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={() => setAcceptedTerms(!acceptedTerms)}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              By ticking this box, you confirm that you have read and agree to
              the
              <Link
                to="/patients/terms-and-conditions"
                className="underline ml-1"
              >
                Terms and Conditions
              </Link>
            </label>
          </div>
        )}

        {!user.hasAcceptedMedicalConsentForm && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedMedicalConsent}
              onCheckedChange={() =>
                setAcceptedMedicalConsent(!acceptedMedicalConsent)
              }
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              By ticking this box, you confirm that you have read and agree to
              the
              <Link
                to="/patients/medical-consent-form"
                className="underline ml-1"
              >
                Medical Consent Form
              </Link>
            </label>
          </div>
        )}
      </section>

      {careFundDiscountAmount > 0 && (
        <div className="border-t mt-5 pt-2 flex justify-between items-center">
          <p className="text-muted-foreground">Total bill</p>

          <p className="font-medium flex gap-2">
            {formatMoney(newBillAmount, "KES")}

            {careFundDiscountAmount > 0 && (
              <span className="text-muted-foreground line-through">
                {formatMoney(totalBillAmount, "KES")}
              </span>
            )}
          </p>
        </div>
      )}

      <Drawer open={isOpen} onOpenChange={setIsOpen} autoFocus={true}>
        <Button disabled={buttonDisabled}>Continue</Button>
        <DrawerContent>
          <img
            src={cash}
            alt="cash"
            className="w-full max-w-[70px] mx-auto my-3"
            aria-hidden="true"
          />
          <DrawerHeader className="sr-only">
            <DrawerTitle>Bill Summary</DrawerTitle>
            <DrawerDescription>
              A breakdown of your total costs
            </DrawerDescription>
          </DrawerHeader>
          <div className="py-4 flex flex-col gap-2">
            <AmountContainer
              leftText="Care Provider:"
              rightText={careProviderName}
            />
            <AmountContainer leftText="Patient Name:" rightText={patientName} />

            {careFundDiscountAmount > 0 ? (
              <AmountContainer
                leftText="Discounted Bill:"
                rightText={formatMoney(newBillAmount, "KES")}
                strikethoughText={formatMoney(totalBillAmount, "KES")}
              />
            ) : (
              <AmountContainer
                leftText="Total Bill:"
                rightText={formatMoney(totalBillAmount, "KES")}
              />
            )}

            <AmountContainer
              leftText="Total Due Later:"
              rightText={formatMoney(dueLaterAmount, "KES")}
            />

            <ProtectedResource
              userRole={user.type}
              allowedRoles={MEMBER_LOAN_ROLES}
            >
              <AmountContainer
                leftText="Transaction Fee:"
                rightText={formatMoney(transactionFee, "KES")}
              />
            </ProtectedResource>

            {youPayTodayAmount > 0 && (
              <AmountContainer
                leftText="You Pay Today:"
                rightText={formatMoney(youPayTodayAmount, "KES")}
              />
            )}

            <ProtectedResource
              userRole={user.type}
              allowedRoles={MEMBER_LOAN_ROLES}
            >
              <>
                <p className="flex text-destructive mt-3 items-center gap-2 text-xs text-center">
                  If your loan payment is delayed, there will be a penalty fee
                  of {formatMoney(lateFee, "KES")}
                </p>
              </>
            </ProtectedResource>
          </div>

          <DrawerFooter>
            <Button
              type="button"
              onClick={() => mutation.mutateAsync()}
              disabled={mutation.isPending || mutation.isSuccess}
              isLoading={mutation.isPending}
            >
              {resolveSubmitButtonText(youPayTodayAmount, "KES")}
            </Button>

            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={() => mutation.reset()}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </form>
  )
}

export function RepaymentPeriodInput({
  control,
  errors,
  loanAmount,
  repaymentPeriodDays,
  fieldName = "repaymentPeriodDays",
}: {
  control: any
  errors: any
  loanAmount: number
  totalBillAmount: number
  repaymentPeriodDays: number
  fieldName?: string
}) {
  const user = usePatientAuthStore((state: any) => state.user) || {}

  const { type, orgBorrower } = user || {}

  const { maxLoanDurationPeriodMonths, maxMonthlyDeductibleAmount } =
    orgBorrower?.creditSettings || {}

  const options = MEMBER_LOAN_ROLES.includes(type)
    ? resolvePublicRepaymentPeriodOptions(loanAmount)
    : resolveOrgRepaymentPeriodOptions(
        loanAmount,
        maxMonthlyDeductibleAmount,
        maxLoanDurationPeriodMonths
      )

  const firstPaymentDue = resolveFirstInstallmentDueDate(
    orgBorrower?.activeOrganization?.settings?.deductionCutOffDay
  )
  return (
    <>
      <Controller
        name={fieldName}
        control={control}
        rules={{ required: "Repayment period is required" }}
        render={({ field }) => (
          <FormGroupSelect
            id={fieldName}
            label="Choose your repayment period"
            placeholder="Select repayment period"
            field={field}
            error={errors[fieldName]?.message}
            options={options}
            defaultValue={control._defaultValues[fieldName]?.toString()}
          />
        )}
      />

      {Number(loanAmount) > 0 && options.length === 0 && (
        <p className="text-orange-500 text-sm">
          Verify your loan amount is lower than the max allowed if you do not
          see any repayment period options
        </p>
      )}

      {user.orgBorrower?.activeOrganization?.orgPlan === "ADVANCE" && (
        <RepaymentTimeline
          loanAmount={loanAmount}
          repaymentPeriodDays={repaymentPeriodDays || 0}
          currency="KES"
          firstPaymentDue={firstPaymentDue}
        />
      )}
    </>
  )
}

function resolveFirstInstallmentDueDate(deductionCutOffDay: number) {
  const today = new Date()

  const cutOffDay = setDate(today, deductionCutOffDay)

  if (isBefore(today, cutOffDay)) {
    return lastDayOfMonth(today)
  }

  return lastDayOfMonth(addMonths(today, 1))
}
