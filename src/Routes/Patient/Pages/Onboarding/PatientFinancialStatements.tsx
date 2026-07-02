import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"
import PatientPageWrapper from "../PatientPageWrapper"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"
import { useLocation, useNavigate } from "react-router-dom"
import FAQSection from "@/components/FAQSection"
import StatementUploadForm from "@/components/StatementUploadForm"
import { PhoneOutgoing } from "lucide-react"
import { useFAQs } from "@/data/faqs"
export const getFinancialStatementsQueryKey = "getFinancialStatements"

// Loan-role access is enforced once at the route level (MemberLoanRouteGuard in
// PatientsHome); this page no longer self-guards.
export default function PatientFinancialStatements() {
  return (
    <PatientPageWrapper
      variant="content"
      headerAlign="start"
      pageTitle={
        <>
          Upload your MPESA statement for the{" "}
          <span className="text-primary">last 6 months</span>
        </>
      }
      description={
        <>
          Increase your limit up to{" "}
          <span className="font-medium">{formatMoney(6_000, "KES")}</span> by
          uploading your MPESA statements
        </>
      }
    >
      <InstructionsSection />
    </PatientPageWrapper>
  )
}

function InstructionsSection() {
  const [showUploadSection, setShowUploadSection] = useState(false)
  const faqs = useFAQs() // Call hook at the top level

  const handleChooseFile = () => {
    setShowUploadSection(true)
  }

  const next = useNextMembershipSetupStep()
  const navigate = useNavigate()

  const location = useLocation()
  const state = location.state
  return (
    <>
      <div>
        <p className=" font-medium">What you'll need</p>
        <ul className="list-disc pl-6 text-neutral-500 text-sm mt-0">
          <li>
            Must be a <strong>PDF</strong> file from Safaricom
          </li>
          <li>
            Maximum file size is <strong>10MB</strong>
          </li>
          <li>
            File may be <strong>password</strong> protected(we'll ask for it)
          </li>
        </ul>
      </div>

      {!showUploadSection && (
        <Button onClick={handleChooseFile}>Choose file</Button>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          navigate(next, {
            state: {
              ...state,
              financialStatements: [],
              skipCreditLimitUpdate: true,
            },
          })
        }}
      >
        Upload Later
      </Button>
      {!showUploadSection && (
        <FAQSection
          faqs={faqs}
          supportAction={{
            label: "Contact Jireh Support",
            icon: <PhoneOutgoing className="h-4 w-4" />,
            onClick: () => {
              window.open("https://wa.me/254117118511", "_blank")
            },
          }}
        />
      )}

      {showUploadSection && <UploadStatements />}
    </>
  )
}

function UploadStatements() {
  const query = useQuery({
    queryKey: [getFinancialStatementsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        import.meta.env.VITE_API_BASE_URL + "/underwriting/financial-statements"
      )
      return response.data
    },
  })

  const next = useNextMembershipSetupStep()
  const navigate = useNavigate()

  const location = useLocation()
  const state = location.state

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const buttonDisabled = query.data?.mpesaStatements?.length === 0

  const mpesaStatements = query.data?.mpesaStatements || []

  return (
    <>
      <StatementUploadForm
        title="MPESA Statements"
        description="Upload your latest MPESA statement for the last 6 months"
        files={mpesaStatements || []}
      />

      <Button
        onClick={() => {
          navigate(next, {
            state: {
              ...state,
              financialStatements: [
                {
                  fileName: mpesaStatements.at(-1)?.fileName || "",
                },
              ],
              skipCreditLimitUpdate: false,
            },
          })
        }}
        disabled={buttonDisabled}
        role="link"
      >
        Submit Statement
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          navigate(next, {
            state: {
              ...state,
              financialStatements: [],
              skipCreditLimitUpdate: true,
            },
          })
        }}
      >
        Upload Later
      </Button>
    </>
  )
}
