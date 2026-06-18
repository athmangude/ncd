import PatientPageWrapper from "../PatientPageWrapper"
import { useNavigate } from "react-router-dom"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"
import { PatientPlan as Plan } from "../../components/PatientPlan"
export default function PatientChooseHealthcarePlan() {
  const navigate = useNavigate()

  const next = useNextMembershipSetupStep()

  return (
    <PatientPageWrapper title="Choose your healthcare plan">
      <Plan
        name="Free"
        price={{ title: "KES 0" }}
        descriptions={[
          {
            title: "Deposit savings to a medical fund",
            description: "Earn 10% interest yearly.",
          },
          {
            title: "Earn cashback on bills paid",
            description: "Get 5% cashback at partner hospitals.",
          },
        ]}
        cta={{
          title: "Get started free",
          onClick: () => {
            navigate(next, {
              state: {
                plan: "FREE",
              },
            })
          },
        }}
      />

      <Plan
        name="Jireh Plus"
        price={{
          title: "KES 499",
          subtitle: "One-time fee",
        }}
        descriptions={[
          {
            title: "Everything in the free tier",
          },
          {
            title: "Interest-free credit",
            description:
              "Access interest free medical loans for outpatient bills and pharmacy.",
          },
        ]}
        cta={{
          title: "Learn More",
          onClick: () => {
            navigate(next, {
              state: {
                plan: "JIREH_PLUS",
              },
            })
          },
        }}
        isActive={true}
      />

      <Plan
        name="Jireh Plus"
        price={{
          title: "From KES 99 per week",
        }}
        descriptions={[
          {
            title: "Everything in the Jireh Plus tier",
          },
          {
            title: "Comprehensive health cover",
            description:
              "Comprehensive financial cover for in-patient hospital care for your family and aging parents.",
          },
        ]}
        cta={{
          title: "Explore plans",
          onClick: () => {
            navigate(next, {
              state: {
                plan: "JIREH_PLUS",
              },
            })
          },
        }}
      />
    </PatientPageWrapper>
  )
}
