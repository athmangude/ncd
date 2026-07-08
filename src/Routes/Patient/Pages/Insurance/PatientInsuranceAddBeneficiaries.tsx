import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { useState } from "react"
import AddCircleMembers, {
  AddCircleMemberInput,
} from "../../components/AddCircleMembers"
import { formatMoney } from "@/utilities/currencyUtilities"

export const STARTER_PRICE = 99
export const GOLD_PRICE = 399

export const ONE_TIME_INSURANCE_FEE = 500

export default function PatientInsuranceAddBeneficiaries() {
  const [circleMembers, setCircleMembers] = useState<AddCircleMemberInput[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}

  return (
    <PatientPageWrapper
      title="Add Beneficiaries"
      primaryCta={{
        label: "Continue",
        onClick: () => {
          navigate("/patients/insurance/pay-for-cover", {
            state: {
              ...state,
              circleMembers,
            },
          })
        },
      }}
    >
      <h1 className="text-center">
        Click to add your friends and family to your cover:
      </h1>

      <AddCircleMembers
        circleMembers={circleMembers}
        setCircleMembers={setCircleMembers}
      />

      <SummaryBlock members={circleMembers} />
    </PatientPageWrapper>
  )
}

export function SummaryBlock({
  members,
}: {
  members?: AddCircleMemberInput[]
}) {
  const location = useLocation()
  // Direct visits/refreshes arrive without router state — render with
  // placeholders instead of crashing on state.insurancePlan.
  const state = location.state || {}

  const { plan, billingSchedule } = state.insurancePlan || {}
  const { circleMembers } = state
  const hasPlan = Boolean(plan && billingSchedule)

  const price = resolvePrice(billingSchedule, plan)

  const planText = hasPlan
    ? `${billingSchedule.toLowerCase()} ${plan.toLowerCase()} plan`
    : "No plan selected"

  const planAmount = hasPlan
    ? resolvePlanText(billingSchedule, plan)
    : undefined
  const numberOfMembers = members?.length || circleMembers?.length || 0

  const totalCost = price * (numberOfMembers + 1)
  return (
    <section className="flex flex-col   w-full border  rounded-lg">
      <SummaryText title="Your plan" text={planText} subtext={planAmount} />

      <SummaryText
        title="One time fee"
        text={formatMoney(ONE_TIME_INSURANCE_FEE, "KES")}
      />

      <SummaryText
        title="No. of beneficiaries"
        text={(numberOfMembers + 1).toString()}
      />

      <div className="flex  justify-between gap-2  border-t font-medium px-2 py-3">
        <p>Total components</p>

        <div className="capitalize text-right">
          <p>
            {formatMoney(totalCost, "KES")} per{" "}
            {billingSchedule
              ? billingSchedule.slice(0, -2).toLowerCase()
              : "period"}
          </p>
        </div>
      </div>
    </section>
  )
}

function SummaryText({
  text,
  subtext,
  title,
}: {
  title: string
  text: string
  subtext?: string
}) {
  return (
    <div className="flex  justify-between gap-2  px-3 py-3">
      <p>{title}</p>

      <div className="capitalize text-right">
        <p>{text}</p>

        {subtext && <p className="text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function resolvePrice(billingSchedule: string, plan: string) {
  let multiplier = 1
  let price = 0

  if (plan === "STARTER") {
    price = STARTER_PRICE
  } else if (plan === "GOLD") {
    price = GOLD_PRICE
  }

  if (billingSchedule === "MONTHLY") {
    multiplier = 1 * 4 //5% discount over 4 weeks
  } else if (billingSchedule === "QUARTERLY") {
    multiplier = 0.95 * 12 //5% discount over 12 weeks
  } else if (billingSchedule === "YEARLY") {
    multiplier = 0.9 * 52 //10% discount over 52 weeks
  }

  return price * multiplier
}

// eslint-disable-next-line react-refresh/only-export-components
export function resolvePlanText(billingSchedule: string, plan: string) {
  const price = resolvePrice(billingSchedule, plan)

  return `${formatMoney(price, "KES")} per ${billingSchedule.slice(0, -2).toLowerCase()}`
}
