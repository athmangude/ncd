import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import successDiscIcon from "@/assets/icons/check-disc.png"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"

export default function PatientCareFundSuccess() {
  const { transferDetails } = useLocation().state || {}

  const navigate = useNavigate()
  return (
    <PatientPageWrapper
      variant="content"
      headerIcon={
        <img src={successDiscIcon} alt="" className={HERO_ILLUSTRATION} />
      }
      pageTitle="Discount Transferred"
      description={
        <>
          <span className="font-medium">
            {formatMoney(
              transferDetails?.transferAmount,
              transferDetails?.currency || "KES"
            )}
          </span>{" "}
          belongs to{" "}
          <span className="font-medium">{transferDetails?.patient?.name}</span>
        </>
      }
    >
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
