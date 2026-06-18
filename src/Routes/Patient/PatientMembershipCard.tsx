import { formatMoney } from "@/utilities/currencyUtilities"
import { usePatientAuthStore } from "./stores/patientAuthStore"
import Logo from "@/components/Logo"
import { Button } from "@/components/Button"
import { ChevronRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import starPercentIcon from "@/assets/icons/star-percent.png"
import { cn } from "@/lib/utils"
import useNextLoanApplicationStep from "./hooks/useNextLoanApplicationStep"
import { getFirstIncompleteStep } from "./hooks/useNextOnboardingStep"
import { ProtectedResource } from "@/components/ProtectedResource"
import { MEMBER_LOAN_ROLES } from "./constants/userTypes"

export function MembershipCards() {
  const user = usePatientAuthStore((state: any) => state.user)

  const { careFundAccount, canPayMedicalBill } = user|| {}

  const navigate = useNavigate()
  const next = useNextLoanApplicationStep()

  return (
    <section
      className={`relative  ${careFundAccount ? "h-[21.5rem]" : "h-64"}`}
    >
      <MembershipCard />
      {careFundAccount && <CareFundCard />}

      <Button
        role="link"
        className="w-full absolute bottom-0 left-0 "
        size="lg"
        disabled={!canPayMedicalBill}
        onClick={() => {
          const nextIncompleteStep = getFirstIncompleteStep(user)

          if (nextIncompleteStep) {
            navigate("/patients/complete-profile", {
              state: {
                onboardingRedirectLink: nextIncompleteStep,
                fromPayMedicalBill: true,
              },
            })
            return
          }

          // Proceed with payment flow
          navigate(next)
        }}
      >
        Pay My Medical Bill
      </Button>
    </section>
  )
}

function MembershipCard() {
  const user = usePatientAuthStore((state: any) => state.user)

  const navigate = useNavigate()

  const { creditLimit, type, canPayMedicalBill } = user || {}

  const { totalCreditLimitAmount, remainingAmount, currency } =
    creditLimit || {}

  const currencyCode = currency?.code || "KES"

  const displayedRemainingCreditLimitAmout = Math.max(
    0,
    Number(remainingAmount ?? 0)
  )

  const totalToRepayAmount = Number(
    totalCreditLimitAmount - displayedRemainingCreditLimitAmout
  )

  const repayableLoan = user?.loans?.find(
    (loan: any) => Number(loan.outstandingAmount) > 0
  )

  return (
    <CardWrapper
      className={`bg-gradient-card to-bubblegum-200 from-bubblegum-100 text-neutral-800 grid shadow-md shadow-neutral-500 z-20 absolute top-0 ${!canPayMedicalBill && "filter grayscale"}`}
    >
      <div className="flex justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-normal font-xl">Available To Borrow</p>
          <p className="text-2xl">
            {formatMoney(displayedRemainingCreditLimitAmout, currencyCode)}
          </p>
        </div>
        <Logo width="100" height="50" fill="hsl(var(--primary))" />
      </div>

      <div className="flex mt-auto justify-between items-center">
        <div className="flex flex-col gap-1">
          <p className="font-normal text-sm">Total To Repay</p>
          <p className="text-lg">
            {formatMoney(totalToRepayAmount, currencyCode)}
          </p>
        </div>

        {repayableLoan && (
          <ProtectedResource userRole={type} allowedRoles={MEMBER_LOAN_ROLES}>
            <Button
              className="bg-white text-primary hover:bg-white flex items-center gap-1"
              role="link"
              onClick={() => {
                navigate("/patients/loans/all-loans")
              }}
            >
              Repay
              <ChevronRight className="h-5 w-5 mt-0.5" />
            </Button>
          </ProtectedResource>
        )}
      </div>
    </CardWrapper>
  )
}

function CareFundCard() {
  const { careFundAccount } =
    usePatientAuthStore((state: any) => state.user) || {}

  const { careFundBalance, currency } = careFundAccount || {}

  return (
    <CardWrapper className="bg-jh-green absolute top-[5.5rem] z-0 flex flex-col justify-end animate-in slide-in-from-top-10 duration-500 ease-out pointer-events-auto">
      <div className="flex items-center gap-3">
        <img
          src={starPercentIcon}
          alt="Care Fund Icon"
          className="w-12  h-12 object-contain"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-1 ">
          <p className="font-normal text-sm">Care Fund Balance:</p>
          <p className="flex items-center">
            {formatMoney(careFundBalance, currency.code)}
          </p>
        </div>

        <Link
          to="/patients/care-fund"
          aria-label="View Care Fund"
          className="ml-auto h-12 w-12 rounded-xl bg-white grid place-items-center"
        >
          <ChevronRight className="h-5 w-5 text-neutral-800" />
        </Link>
      </div>
    </CardWrapper>
  )
}

export function CardWrapper({
  className,
  children,
  style,
}: {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn("w-full h-48 rounded-3xl p-5 font-medium", className)}
      style={style}
    >
      {children}
    </div>
  )
}
