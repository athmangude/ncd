import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import successDiscIcon from "@/assets/icons/check-disc.png"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"

export default function PatientCareFundSuccess() {
  const { transferDetails } = useLocation().state || {}

  const navigate = useNavigate()
  return (
    <PatientPageWrapper
      title="Care Fund Transfer Success"
      className="text-center"
    >
      <img
        src={successDiscIcon}
        alt="Success Icon"
        className="w-full max-w-[100px] mx-auto my-3"
        aria-hidden="true"
      />
      <h1 className="text-2xl font-medium">Discount Transferred</h1>

      <p className="text-neutral-500 text-lg">
        <span className="font-medium">
          {formatMoney(
            transferDetails?.transferAmount,
            transferDetails?.currency || "KES"
          )}
        </span>{" "}
        belongs to{" "}
        <span className="font-medium">{transferDetails?.patient?.name}</span>
      </p>

      <Button
        role="link"
        onClick={() => navigate("/patients")}
        className="mt-5"
      >
        Back To Dashboard
      </Button>
    </PatientPageWrapper>
  )
}
