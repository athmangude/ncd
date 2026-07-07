import PatientPageWrapper from "../PatientPageWrapper"
import paymentHistoryIcon from "@/assets/icons/payment-history.png"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"
import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import healthUserIcon from "@/assets/icons/health-user.png"
import cashIcon from "@/assets/icons/cash.png"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import ExplainerBlock from "../../components/PatientExplainerBlock"
export default function PatientOrgHowItWorks() {
  const next = useNextMembershipSetupStep()
  const navigate = useNavigate()

  const user = usePatientAuthStore((state: any) => state.user) || {}

  const orgPlan = user?.orgBorrower?.activeOrganization?.orgPlan

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle="How it works"
      footer={
        <div className="border-t bg-card p-4">
          <Button
            role="link"
            onClick={() => navigate(next)}
            className="w-full"
            size="lg"
          >
            Complete My Profile
          </Button>
        </div>
      }
    >
      {orgPlan === "ADVANCE" ? <EmployerExplainer /> : <SaccoExplainer />}
    </PatientPageWrapper>
  )
}

function EmployerExplainer() {
  return (
    <div className="grid gap-2 w-full">
      <ExplainerBlock
        icon={
          <img
            src={paymentHistoryIcon}
            alt="Payment History"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="Your employer adds you as a member"
        variant="completed"
      />
      <ExplainerBlock
        icon={
          <img
            src={healthUserIcon}
            alt="User Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="You complete your profile"
        variant="current"
      />
      <ExplainerBlock
        icon={
          <img
            src={paymentHistoryIcon}
            alt="Payment History"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="You visit a care provider and pay for treatment"
        variant="next"
      />
      <ExplainerBlock
        icon={
          <img
            src={cashIcon}
            alt="Cash Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="Bill amount is deducted from your next salary"
        variant="next"
      />
    </div>
  )
}

function SaccoExplainer() {
  return (
    <div className="grid gap-2 w-full">
      <ExplainerBlock
        icon={
          <img
            src={paymentHistoryIcon}
            alt="Payment History"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="Your SACCO adds you as a member"
        variant="completed"
      />
      <ExplainerBlock
        icon={
          <img
            src={healthUserIcon}
            alt="User Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="You complete your profile"
        variant="current"
      />
      <ExplainerBlock
        icon={
          <img
            src={paymentHistoryIcon}
            alt="Payment History"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="You visit a care provider and pay for treatment"
        variant="next"
      />
      <ExplainerBlock
        icon={
          <img
            src={cashIcon}
            alt="Cash Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="Repay your loan before the due date directly through your SACCO's app/paybill"
        variant="next"
      />
    </div>
  )
}
