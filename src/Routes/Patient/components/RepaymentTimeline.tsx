import { cn } from "@/lib/utils"
import { formatMoney } from "@/utilities/currencyUtilities"
import { resolveOrdinal } from "@/utilities/textUtilities"
import { addMonths } from "date-fns"

export function RepaymentTimeline({
  loanAmount,
  repaymentPeriodDays,
  currency,
  className,
  firstPaymentDue,
}: {
  loanAmount: number
  repaymentPeriodDays: number
  currency: string
  firstPaymentDue: Date
  className?: string
}) {
  const repaymentPeriodMonths = Math.max(
    Math.floor(repaymentPeriodDays / 30),
    1
  )

  const monthlyRepaymentAmount = Math.ceil(loanAmount / repaymentPeriodMonths)
  let remainingAmount = loanAmount

  const installments = Array.from({ length: repaymentPeriodMonths }, (_, i) => {
    const dueDate = addMonths(firstPaymentDue, i)

    const amount =
      i + 1 === repaymentPeriodMonths ? remainingAmount : monthlyRepaymentAmount
    remainingAmount -= monthlyRepaymentAmount

    return {
      amount,
      dueDate,
    }
  })

  return (
    <div className={cn("overflow-x-auto no-scrollbar pb-1", className)}>
      <h3 className="mb-2 text-neutral-500 font-light text-lg">
        Salary Advance Plan
      </h3>
      <div className="flex gap-10">
        {installments.map((installment, index) => (
          <Installment
            key={index}
            amount={installment.amount}
            currency={currency}
            installmentNumber={index + 1}
            dueDate={installment.dueDate}
          />
        ))}
      </div>
      <div
        className="w-full h-1 rounded-full bg-neutral-200"
        aria-hidden="true"
      ></div>
    </div>
  )
}

function Installment({
  amount,
  currency,
  installmentNumber,
  dueDate,
}: {
  amount: number
  currency: string
  installmentNumber: number
  dueDate: Date
}) {
  const month = dueDate.toLocaleString("default", { month: "short" })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDateHasPassed = dueDate
    ? (dueDate.setHours(0, 0, 0, 0), dueDate < today)
    : false
  return (
    <div className="flex flex-col gap-2 transform translate-y-2 ">
      <div className="text-neutral-500 text-sm flex">
        {`${resolveOrdinal(installmentNumber)} deduction`}
      </div>
      <div className={`${dueDateHasPassed && "line-through"}`}>
        {formatMoney(amount, currency)}
      </div>

      <div
        className={`text-neutral-500 flex ${dueDateHasPassed && "line-through"}`}
      >
        {month}
      </div>

      <div className="w-3 h-3 rounded-full bg-neutral-200 font-medium"></div>
    </div>
  )
}
