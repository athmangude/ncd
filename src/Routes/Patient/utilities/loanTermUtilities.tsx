import { formatMoney } from "@/utilities/currencyUtilities"
import { DEFAULT_INTEREST_RATE_PERCENTAGE } from "../constants/loantTermConstants"
import { MEMBER_LOAN_ROLES, UserType } from "../constants/userTypes"

export function resolvePublicRepaymentPeriodOptions(_loanAmount: number) {
  const repaymentPeriodOptions = [
    //   { value: "14", name: "2 Weeks - Interest Free!" },
    { value: "31", name: "31 days" },
    //  { value: "61", name: "61 days" },
  ]

  // if (loanAmount <= 1000) {
  //   return repaymentPeriodOptions.filter((option) => Number(option.value) <= 14)
  // }

  // if (loanAmount <= 4000) {
  //   return repaymentPeriodOptions.filter((option) => Number(option.value) <= 31)
  // }

  return repaymentPeriodOptions
}

export function resolveOrgRepaymentPeriodOptions(
  loanAmount: number,
  maxMonthlyDeductibleAmount: number,
  maxLoanDurationPeriodMonths: number
) {
  if (
    !loanAmount ||
    !maxMonthlyDeductibleAmount ||
    !maxLoanDurationPeriodMonths
  ) {
    return []
  }

  let repaymentPeriodOptions = [
    { value: "30", name: "1 month" },
    { value: "60", name: "2 months" },
    { value: "90", name: "3 months" },
    { value: "120", name: "4 months" },
    { value: "150", name: "5 months" },
    { value: "180", name: "6 months" },
  ].filter(
    (option) => Number(option.value) <= Number(maxLoanDurationPeriodMonths * 30)
  ) //Filter out options that exceed the max loan duration period for the org

  const minimumRepaymentPeriodDays =
    Math.ceil(loanAmount / maxMonthlyDeductibleAmount) * 30

  repaymentPeriodOptions = repaymentPeriodOptions.filter(
    (option) => Number(option.value) >= minimumRepaymentPeriodDays
  )

  return repaymentPeriodOptions
}

export function resolveMaxLoanAmount({
  remainingCreditLimitAmount,
  newBillAmount,
  patientType,
  maxLoanDurationPeriodMonths,
  maxMonthlyDeductibleAmount,
}: {
  remainingCreditLimitAmount: number
  newBillAmount: number
  patientType: UserType
  maxMonthlyDeductibleAmount: number
  maxLoanDurationPeriodMonths: number
}) {
  if (MEMBER_LOAN_ROLES.includes(patientType)) {
    return Math.min(remainingCreditLimitAmount, newBillAmount)
  }

  const maxLoanAmount = maxLoanDurationPeriodMonths * maxMonthlyDeductibleAmount

  return Math.min(remainingCreditLimitAmount, maxLoanAmount)
}

export function resolveInterestRate(
  loanAmount: number,
  repaymentPeriodDays: number
) {
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

export function resolveYouPayTodayAmount({
  totalBillAmount,
  loanAmount,
  careFundDiscountAmount,
  transactionFee,
  patientType,
}: {
  totalBillAmount: number
  loanAmount: number
  careFundDiscountAmount: number
  transactionFee: number
  patientType: UserType
}) {
  const topUpAmount = Math.max(
    totalBillAmount - Number(loanAmount) - careFundDiscountAmount,
    0
  )

  if (patientType === "ORG") {
    return topUpAmount
  }

  const youPayTodayAmount = topUpAmount + transactionFee

  return youPayTodayAmount
}

export function resolveSubmitButtonText(
  youPayTodayAmount: number,
  currency: string
) {
  if (youPayTodayAmount > 0) {
    return `Pay ${formatMoney(youPayTodayAmount, currency)}`
  }

  return "Submit"
}
