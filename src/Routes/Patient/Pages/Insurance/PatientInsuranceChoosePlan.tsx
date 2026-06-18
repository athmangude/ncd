import { useState } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import PlanSelector from "../../components/PlanSelector"
import { PatientPlan } from "../../components/PatientPlan"
import { useNavigate } from "react-router-dom"
import { resolvePlanText } from "./PatientInsuranceAddBeneficiaries"

type InsurancePlan = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"

export default function PatientInsuranceChoosePlan() {
  const [billingSchedule, setBillingSchedule] =
    useState<InsurancePlan>("WEEKLY")

  const navigate = useNavigate()

  const starterPlanText = resolvePlanText(billingSchedule, "STARTER")
  const goldPlanText = resolvePlanText(billingSchedule, "GOLD")

  return (
    <PatientPageWrapper title="Your Plan">
      <h1 className="text-2xl font-medium text-center mb-4">
        Choose your membership plan
      </h1>

      <section className="flex flex-wrap gap-4 justify-center">
        <PlanSelector
          label="Weekly"
          isActive={billingSchedule === "WEEKLY"}
          onClick={() => setBillingSchedule("WEEKLY")}
        />
        <PlanSelector
          label="Monthly"
          isActive={billingSchedule === "MONTHLY"}
          onClick={() => setBillingSchedule("MONTHLY")}
        />
        <PlanSelector
          label="Quarterly (5% off)"
          isActive={billingSchedule === "QUARTERLY"}
          onClick={() => setBillingSchedule("QUARTERLY")}
        />
        <PlanSelector
          label="Yearly (10% off)"
          isActive={billingSchedule === "YEARLY"}
          onClick={() => setBillingSchedule("YEARLY")}
        />
      </section>

      <section className="flex flex-col gap-5">
        <PatientPlan
          name="Starter Plan"
          price={{
            title: starterPlanText,
          }}
          descriptions={[
            {
              title: "Annual coverage",
              description: "KES 300,000",
            },
            {
              title: "Co-pay credit line",
              description: "(per visit)",
            },
            {
              title: "Joining fee (one-time, non-refundable)",
              description: "KES 499",
            },
          ]}
          cta={{
            title: "Continue with Starter Plan",
            onClick: () => {
              navigate("/patients/insurance/add-beneficiaries", {
                state: {
                  insurancePlan: {
                    billingSchedule,
                    plan: "STARTER",
                  },
                },
              })
            },
          }}
        />
        <PatientPlan
          name="Gold Plan"
          price={{
            title: goldPlanText,
          }}
          descriptions={[
            {
              title: "Annual coverage",
              description: "KES 1,000,000",
            },
            {
              title: "Co-pay credit line",
              description: "(per visit)",
            },
            {
              title: "Joining fee (one-time, non-refundable)",
              description: "KES 499",
            },
          ]}
          cta={{
            title: "Continue with Gold Plan",
            onClick: () => {
              navigate("/patients/insurance/add-beneficiaries", {
                state: {
                  insurancePlan: {
                    billingSchedule,
                    plan: "GOLD",
                  },
                },
              })
            },
          }}
        />
      </section>
    </PatientPageWrapper>
  )
}
