import LoadingPage from "@/Routes/LoadingPage"
import PatientPageWrapper from "../PatientPageWrapper"
import ErrorBlock from "@/components/ErrorBlock"
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query"
import axios from "axios"
import {
  CircleCheckBigIcon,
  CreditCard,
  Landmark,
  Smartphone,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Checkbox } from "@/components/Checkbox"
import { useToast } from "@/hooks/useToast"
import mpesa from "@/assets/icons/mpesa.svg"
import mastercard from "@/assets/icons/mastercard.svg"
import visa from "@/assets/icons/visa.png"
import { useNavigate } from "react-router-dom"

export default function InitiatePayment() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showExistingPaymentMethods, setShowExistingPaymentMethods] =
    useState(false)

  //TODO: fetch transaction associated with this payment
  const query = useQuery({
    queryKey: ["getPaymentMethods"],
    queryFn: async () => {
      const response = await axios.get(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/patients/payments/payment-methods"
      )

      const { hasSetUpPaymentMethods } = response.data
      setShowExistingPaymentMethods(hasSetUpPaymentMethods)

      return response.data
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/patients/payments/initiate-payment",
        {
          paymentMethodType: data.paymentMethod,
          paymentMethodId: data.paymentMethodId,
          transactionId: "TODO", //TODO: use transaction id from query
        }
      )

      return result.data
    },
    onSuccess: (data) => {
      const { isChargeTransaction, authorizationUrl, reference } = data

      toast({
        title: "Success",
        description:
          "Payment initiated successfully. You will be redirected shortly.",
      })
      if (isChargeTransaction) {
        navigate(`/patients/transaction-result?reference=${reference}`)
      } else {
        window.location.assign(authorizationUrl)
      }
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
  const { creditCards, debitCards, mobileMoneyAccounts } = query.data

  return (
    <PatientPageWrapper title="Payment Methods">
      <div className="">
        <h2 className="font-bold">Select a payment method</h2>
        <p className="text-sm">
          Your payment method will be saved for future payments
        </p>
      </div>

      {showExistingPaymentMethods ? (
        <ExistingPaymentMethods
          creditCards={creditCards}
          debitCards={debitCards}
          mobileMoneyAccounts={mobileMoneyAccounts}
          setShowExistingPaymentMethods={setShowExistingPaymentMethods}
          mutation={mutation}
        />
      ) : (
        <PaymentMethodList mutation={mutation} />
      )}
    </PatientPageWrapper>
  )
}

type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "MOBILE_MONEY"

type PaymentMethodListProps = {
  mutation: UseMutationResult<any>
}
function PaymentMethodList({ mutation }: PaymentMethodListProps) {
  const [hasConsentedToSavingDetails, setHasConsentedToSavingDetails] =
    useState(false)
  const [activePaymentMethod, setActivePaymentMethod] =
    useState<PaymentMethod>("CREDIT_CARD")

  return (
    <>
      <div className="flex flex-col gap-4">
        <PaymentMethod
          title="Credit Card"
          description="Payment will be charged to your card"
          icon={<CreditCard className="w-6 h-6 text-primary" />}
          type="CREDIT_CARD"
          activePaymentMethod={activePaymentMethod}
          setActivePaymentMethod={setActivePaymentMethod}
        />
        <PaymentMethod
          title="Debit Card"
          description="Payment will be charged to your bank account"
          icon={<Landmark className="w-6 h-6 text-primary" />}
          type="DEBIT_CARD"
          activePaymentMethod={activePaymentMethod}
          setActivePaymentMethod={setActivePaymentMethod}
        />
        <PaymentMethod
          title="Mobile Money"
          description="Payment will be charged to your phone number"
          icon={<Smartphone className="w-6 h-6 text-primary" />}
          type="MOBILE_MONEY"
          activePaymentMethod={activePaymentMethod}
          setActivePaymentMethod={setActivePaymentMethod}
        />
      </div>
      <div className="flex items-center space-x-2 mt-5">
        <Checkbox
          id="consentToSavingPaymentDetails"
          checked={hasConsentedToSavingDetails}
          onCheckedChange={() =>
            setHasConsentedToSavingDetails(!hasConsentedToSavingDetails)
          }
        />
        <label
          htmlFor="consentToSavingPaymentDetails"
          className="text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex gap-2 items-center"
        >
          I agree to save my payment method for future transactions
          <CircleCheckBigIcon className="w-4 h-4 text-green-500" />
        </label>
      </div>
      <Button
        type="button"
        onClick={() => mutation.mutate({ paymentMethod: activePaymentMethod })}
        disabled={!hasConsentedToSavingDetails || mutation.isPending}
        isLoading={mutation.isPending}
      >
        Next
      </Button>
    </>
  )
}

type PaymentMethodProps = {
  title: string
  description: string
  icon: React.ReactNode
  type: PaymentMethod
  activePaymentMethod: PaymentMethod
  setActivePaymentMethod: (type: PaymentMethod) => void
}
function PaymentMethod({
  title,
  description,
  icon,
  type,
  activePaymentMethod,
  setActivePaymentMethod,
}: PaymentMethodProps) {
  const active = activePaymentMethod === type
  return (
    <button
      className={`flex items-center gap-5 px-5 py-3 border-2 rounded-lg justify-start text-left
        ${active && "border-primary bg-primary/5"}
        `}
      aria-label={`Set ${title} as active payment method`}
      onClick={() => setActivePaymentMethod(type)}
    >
      {icon}
      <div className="text-sm">
        <p className="font-medium">{title}</p>
        <p className="text-xs">{description}</p>
      </div>
    </button>
  )
}
type ExistingPaymentMethodsProps = {
  creditCards: any[]
  debitCards: any[]
  mobileMoneyAccounts: any[]
  setShowExistingPaymentMethods: (state: boolean) => void
  mutation: UseMutationResult<any>
}
function ExistingPaymentMethods({
  creditCards,
  debitCards,
  mobileMoneyAccounts,
  setShowExistingPaymentMethods,
  mutation,
}: ExistingPaymentMethodsProps) {
  const [activePaymentMethod, setActivePaymentMethod] = useState<number>(0)

  const canProceed = activePaymentMethod !== 0

  return (
    <>
      {creditCards.length > 0 && (
        <div className="flex flex-col gap-4 ">
          <h3 className="font-medium text-neutral-500">Credit Cards</h3>

          {creditCards.map((card: any) => (
            <ExistingMethod
              key={card.id}
              method={card}
              activePaymentMethod={activePaymentMethod}
              setActivePaymentMethod={setActivePaymentMethod}
            />
          ))}
        </div>
      )}
      {debitCards.length > 0 && (
        <div className="flex flex-col gap-4 ">
          <h3 className="font-medium text-neutral-500">Debit Cards</h3>
          {debitCards.map((card: any) => (
            <ExistingMethod
              key={card.id}
              method={card}
              activePaymentMethod={activePaymentMethod}
              setActivePaymentMethod={setActivePaymentMethod}
            />
          ))}
        </div>
      )}
      {mobileMoneyAccounts.length > 0 && (
        <div className="flex flex-col gap-4 ">
          <h3 className="font-medium text-neutral-500">Mobile Money Accounts</h3>

          {mobileMoneyAccounts.map((account: any) => (
            <ExistingMethod
              key={account.id}
              method={account}
              activePaymentMethod={activePaymentMethod}
              setActivePaymentMethod={setActivePaymentMethod}
            />
          ))}
        </div>
      )}

      <p className="text-sm">
        Don't want to pay with these methods?{" "}
        <Button
          variant="link"
          className="text-sm"
          onClick={() => setShowExistingPaymentMethods(false)}
        >
          Add New Method
        </Button>
      </p>

      <Button
        disabled={!canProceed || mutation.isPending}
        isLoading={mutation.isPending}
        onClick={() =>
          mutation.mutate({ paymentMethodId: activePaymentMethod })
        }
      >
        Next
      </Button>
    </>
  )
}

type ExistingMethodProps = {
  method: any
  activePaymentMethod: number
  setActivePaymentMethod: (type: number) => void
}
function ExistingMethod({
  method,
  activePaymentMethod,
  setActivePaymentMethod,
}: ExistingMethodProps) {
  const active = activePaymentMethod === method.id

  return (
    <button
      className={`h-14 flex items-center gap-5 px-5 py-3 border-2 rounded-lg justify-start text-left
        ${active && "border-primary bg-primary/5"}
        `}
      onClick={() => setActivePaymentMethod(method.id)}
    >
      {method.type === "MOBILE_MONEY" ? (
        <MobileMoney account={method.mobileMoneyAccount} />
      ) : (
        <Card card={method.cardDetails} />
      )}
    </button>
  )
}

function Card({ card }: { card: any }) {
  return (
    <>
      <img src={resolveCardIcon(card.cardType)} alt="card" className="h-7" />

      <div className="flex gap-3 font-medium text-neutral-600">
        <div className="flex items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i}>*</span>
          ))}
        </div>
        <div className="flex items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i}>*</span>
          ))}
        </div>
        <div className="flex items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i}>*</span>
          ))}
        </div>
        <div>{card.last4Digits}</div>
      </div>
    </>
  )
}

function MobileMoney({ account }: { account: any }) {
  return (
    <>
      <img src={mpesa} alt="mpesa" className="h-7" />

      <p className="font-medium text-neutral-600">{account.phoneNumber}</p>
    </>
  )
}

function resolveCardIcon(cardType: string) {
  switch (cardType) {
    case "VISA":
      return visa
    case "MASTERCARD":
      return mastercard
    default:
      return visa
  }
}
