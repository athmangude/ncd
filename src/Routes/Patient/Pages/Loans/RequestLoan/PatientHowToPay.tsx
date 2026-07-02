import { useNavigate } from "react-router-dom"
import PatientPageWrapper from "../../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import { Button } from "@/components/Button"
import useNextLoanApplicationStep from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import careproviderIcon from "@/assets/icons/care-provider.png"

export default function PatientHowToPay() {
  const navigate = useNavigate()
  const next = useNextLoanApplicationStep()

  return (
    <PatientPageWrapper
      variant="content"
      headerAlign="start"
      headerIcon={<img src={careproviderIcon} alt="" className={HEADER_ICON} />}
      pageTitle="Pay to over 14,000 licensed health facilities in Kenya."
      footer={
        <div className="border-t bg-white p-4">
          <Button
            role="link"
            className="w-full"
            size="lg"
            onClick={() => navigate(next)}
          >
            Proceed to pay
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-normal text-neutral-500">How to pay :</h2>

          <div className="flex gap-3">
            <span className="text-sm text-neutral-500 font-normal flex-shrink-0">
              01
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-black">Upload your invoice.</p>
              <p className="text-sm text-neutral-500">
                Confirm the details are correct.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-sm text-neutral-500 font-normal flex-shrink-0">
              02
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-black">Choose how you want to pay.</p>
              <p className="text-sm text-neutral-500">
                Use MPESA, Card, cashback or a Jireh loan.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-sm text-neutral-500 font-normal flex-shrink-0">
              03
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-black">Make payment.</p>
              <p className="text-sm text-neutral-500">Get care now.</p>
            </div>
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
