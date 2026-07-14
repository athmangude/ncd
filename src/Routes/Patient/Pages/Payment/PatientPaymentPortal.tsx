import { useNavigate } from "react-router-dom"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Drawer,
  DrawerTrigger,
} from "@/components/Drawer"
import { useToast } from "@/hooks/useToast"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Button } from "@/components/Button"
import cashIcon from "@/assets/icons/cash.png"
import { formatMoney } from "@/utilities/currencyUtilities"
import { trackEvent, EVENTS } from "@/analytics"
import { safeAmount } from "@/analytics/metadata"

export default function PaymentPortal({
  loanId,
  initialPaymentAmount,
  amountIsChangeable = true,
  description,
  isTransactionFeePayment = false,
  title,
  children,
}: {
  children: React.ReactNode
  initialPaymentAmount: number
  amountIsChangeable?: boolean
  maxPayableAmount: number
  loanId: number
  title: string
  description: string
  isTransactionFeePayment?: boolean
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState<number | string>(initialPaymentAmount)

  const mutation = useMutation({
    mutationFn: async () => {
      validatePaymentAmount(amount)

      try {
        trackEvent(EVENTS.LOAN_REPAYMENT.PAYMENT_SUBMIT, {
          loanId,
          amount: safeAmount(amount),
          isTransactionFeePayment,
        })
      } catch {
        // Silent fail
      }

      const result = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          `/loans/patient/me/initiate-repayment`,
        {
          amount: amount,
          loanId: loanId,
          isTransactionFeePayment,
        }
      )

      return result.data
    },
    onSuccess: (data) => {
      const { isChargeTransaction, authorizationUrl, reference } = data

      // A repayment changes several server-derived views at once: the loan's
      // outstanding/repaid/timeline, the dashboard loan + payments cards
      // (available-to-borrow restored, outstanding reduced), and the cashback
      // balance + ledger (5% reward). Invalidate every query that reads those so
      // the UI reflects even a partial repayment immediately, not only after a
      // remount-driven refetch.
      ;[
        "loanStats", // dashboard loan + payments cards (available to borrow, outstanding)
        "paymentHistory", // payments history + cashback balance/records
        "careFundTransactions", // cashback ledger (progressive earnings)
        "getPatientLoanDetails", // loan details: outstanding, repaid, reminder, CTA, timeline
        "patientLoginDetails", // profile creditLimit / careFund balance
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))

      try {
        trackEvent(EVENTS.LOAN_REPAYMENT.PAYMENT_SUCCESS, {
          loanId,
          amount: safeAmount(amount),
          isChargeTransaction,
        })
      } catch {
        // Silent fail
      }

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
      try {
        trackEvent(EVENTS.LOAN_REPAYMENT.PAYMENT_ERROR, {
          loanId,
          errorMessage: error.response?.data?.message || error.message,
        })
      } catch {
        // Silent fail
      }

      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <Drawer
      onOpenChange={(open) => {
        if (open) {
          try {
            trackEvent(EVENTS.LOAN_REPAYMENT.PAYMENT_VIEW, {
              loanId,
              initialPaymentAmount: safeAmount(initialPaymentAmount),
            })
          } catch {
            // Silent fail
          }
        }
      }}
    >
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5">
          <img
            src={cashIcon}
            alt="cash"
            className="w-full max-w-[70px] mx-auto"
            aria-hidden="true"
          />
          <p className="flex text-muted-foreground text-sm justify-between">
            Amount to repay:
            <span>{formatMoney(initialPaymentAmount, "KES")}</span>
          </p>
          <Label htmlFor="paymentAmount">Amount</Label>
          <Input
            id="paymentAmount"
            type="text"
            placeholder="Enter payment amount"
            className="w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={!amountIsChangeable}
          />
        </div>

        <DrawerFooter>
          <Button
            onClick={(e) => {
              e.preventDefault()
              mutation.mutateAsync()
            }}
            className="w-full"
            isLoading={mutation.isPending}
            disabled={mutation.isPending || mutation.isSuccess}
          >
            Pay
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>

      <DrawerTrigger asChild>{children}</DrawerTrigger>
    </Drawer>
  )
}

function validatePaymentAmount(amount: string | number) {
  const amountToValidate =
    typeof amount === "string" ? parseFloat(amount) : amount

  if (isNaN(amountToValidate)) {
    throw new Error("Amount must be a number")
  }

  if (amountToValidate <= 0) {
    throw new Error("Amount must be greater than 0")
  }

  return true
}
