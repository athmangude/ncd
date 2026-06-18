import PatientPageWrapper from "../PatientPageWrapper"
import { SummaryBlock } from "./PatientInsuranceAddBeneficiaries"
import { PatientPlan } from "../../components/PatientPlan"
import { useState } from "react"
import { WaitlistDialog } from "../../components/WaitlistDialog"
import { useLocation } from "react-router-dom"

type WhoIsPaying = "MYSELF" | "KENYAN_SPONSOR" | "INT_SPONSOR"

export default function PatientInsurancePayForCover() {
  const [whoIsPaying, setWhoIsPaying] = useState<WhoIsPaying>("MYSELF")
  const location = useLocation()
  const state = location.state || {}

  return (
    <PatientPageWrapper title="Pay">
      <h1 className="text-2xl font-medium text-center mb-4">
        Pay for your cover
      </h1>
      <SummaryBlock />

      <section className="flex flex-col gap-5">
        <PatientPlan
          name="Pay Myself"
          descriptions={[
            {
              title: "MPESA STK push",
            },
            {
              title: "Bank debit/credit card",
            },
            {
              title: "Instant payment processing",
            },
          ]}
          cta={{
            title: "Select",
            onClick: () => {
              setWhoIsPaying("MYSELF")
            },
          }}
          isActive={whoIsPaying === "MYSELF"}
        />
        <PatientPlan
          name="Kenyan sponsor"
          descriptions={[
            {
              title: "Someone in Kenya pays for me",
            },
            {
              title: "Send payment request to local contact",
            },
            {
              title: "They pay via MPESA or bank transfer",
            },
            {
              title: "Coverage starts after payment",
            },
          ]}
          cta={{
            title: "Select",
            onClick: () => {
              setWhoIsPaying("KENYAN_SPONSOR")
            },
          }}
          isActive={whoIsPaying === "KENYAN_SPONSOR"}
        />
        <PatientPlan
          name="International sponsor"
          descriptions={[
            {
              title: "Someone abroad pays for me",
            },
            {
              title: "International payment options",
            },
            {
              title: "Visa/Mastercard, PayPal, Remitly",
            },
            {
              title: "Send payment link via email/WhatsApp",
            },
          ]}
          cta={{
            title: "Select",
            onClick: () => {
              setWhoIsPaying("INT_SPONSOR")
            },
          }}
          isActive={whoIsPaying === "INT_SPONSOR"}
        />
      </section>

      <WaitlistDialog
        title="Coming soon"
        description="We will keep you posted.
We are working on making affordable health insurance a reality."
        dialog={{
          title: "Jireh Insurance Coming Soon",
          description:
            "We will keep you posted. We are working on making affordable health insurance a reality.",
          triggerLabel: "Pay",
        }}
        waitlistType="JIREH_PLUS"
        submitButtonLabel="Explore Other Plans"
        navigateOnSuccessLink="/patients/choose-healthcare-plan"
        metadata={{
          ...state,
          whoIsPaying,
        }}
      />
    </PatientPageWrapper>
  )
}
