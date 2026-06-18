import ExplainerBlock from "../../components/PatientExplainerBlock"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import careProviderIcon from "@/assets/icons/care-provider.png"
import paymentHistoryIcon from "@/assets/icons/payment-history.png"
import cashIcon from "@/assets/icons/cash.png"

export default function PatientCareFundExplainer() {
  const { careFundAccount } =
    usePatientAuthStore((state: any) => state.user) || {}

  return (
    <section className="flex flex-col gap-5">
      <h3 className="font-bold text-lg text-neutral-900 mt-2">How it works</h3>

      {careFundAccount ? (
        <ActiveCareFundExplainer />
      ) : (
        <InactiveCareFundExplainer />
      )}
    </section>
  )
}

function InactiveCareFundExplainer() {
  return (
    <>
      <ExplainerBlock
        icon={
          <img
            src={careProviderIcon}
            alt="Care Provider Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="Visit a care provider"
        variant="info"
      />
      <ExplainerBlock
        icon={
          <img
            src={paymentHistoryIcon}
            alt="Payment History Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="Choose how much Care Savings to use"
        variant="info"
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
        title="Pay the remaining bill easily using cash or Jireh loan"
        variant="info"
      />
    </>
  )
}

function ActiveCareFundExplainer() {
  return (
    <>
      <ExplainerBlock
        icon={
          <img
            src={careProviderIcon}
            alt="Care Provider Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="You visit a care provider"
        variant="info"
      />
      <ExplainerBlock
        icon={
          <img
            src={paymentHistoryIcon}
            alt="Payment History Icon"
            className="w-10 h-10 object-contain"
            aria-hidden="true"
          />
        }
        title="Choose how much you want to reduce your bill"
        variant="info"
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
        title="Pay the discounted bill with cash or a Jireh loan"
        variant="info"
      />
    </>
  )
}
