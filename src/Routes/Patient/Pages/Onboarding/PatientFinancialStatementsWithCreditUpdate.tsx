import { useState } from "react"
import { PhoneOutgoing } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useLocation } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { formatMoney } from "@/utilities/currencyUtilities"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Button } from "@/components/Button"
import { patientLoginDetailsQueryKey } from "../PatientsHome"
import FAQSection from "@/components/FAQSection"
import { SectionTitle } from "@/components/SectionTitle"
import StatementUploadForm from "@/components/StatementUploadForm"
import { useFAQs } from "@/data/faqs"

export const getFinancialStatementsQueryKey = "getFinancialStatements"
// Loan-role access is enforced once at the route level (MemberLoanRouteGuard in
// PatientsHome); this page no longer self-guards.
export default function PatientFinancialStatementsWithCreditUpdate() {
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="M-Pesa statement"
      headerAlign="start"
      pageTitle={
        showSuccessScreen ? undefined : (
          <>
            Upload your MPESA statement for the{" "}
            <span className="text-primary">last 6 months</span>
          </>
        )
      }
      description={
        showSuccessScreen ? undefined : (
          <>
            Increase your limit up to{" "}
            <span className="font-medium">{formatMoney(6_000, "KES")}</span> by
            uploading your MPESA statements
          </>
        )
      }
    >
      {showSuccessScreen ? (
        <SuccessScreen />
      ) : (
        <UploadStatements setShowSuccessScreen={setShowSuccessScreen} />
      )}
    </PatientPageWrapper>
  )
}

function UploadStatements({
  setShowSuccessScreen,
}: {
  setShowSuccessScreen: (value: boolean) => void
}) {
  // Move all hooks to the top level
  const [showUploadSection, setShowUploadSection] = useState(false)
  const faqs = useFAQs() // Call hook at the top level

  const handleChooseFile = () => {
    setShowUploadSection(true)
  }

  const query = useQuery({
    queryKey: [getFinancialStatementsQueryKey],
    queryFn: async () => {
      return { mpesaStatements: [] }
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const buttonDisabled = query.data?.mpesaStatements?.length === 0

  return (
    <>
      <div>
        <SectionTitle>What you'll need</SectionTitle>
        <ul className="list-disc pl-6 text-muted-foreground text-sm mt-0">
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

      {showUploadSection && (
        <>
          <StatementUploadForm
            title="MPESA Statements"
            description="Upload your latest MPESA statement for the last 6 months"
            files={query.data?.mpesaStatements || []}
          />
          <Button
            onClick={() => {
              setShowSuccessScreen(true)
            }}
            disabled={buttonDisabled}
          >
            Continue
          </Button>
        </>
      )}
    </>
  )
}

function SuccessScreen() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo
  const returnState = location.state?.returnState

  const handleContinue = () => {
    // Navigate immediately so the UI doesn't block (dashboard will refetch on mount)
    if (returnTo) {
      navigate(returnTo, {
        state: {
          ...returnState,
          openLoanDrawer: true,
        },
      })
    } else {
      navigate("/patients")
    }
    // Invalidate in background so dashboard (and any other consumers) refetch login-details
    queryClient.invalidateQueries({
      queryKey: [patientLoginDetailsQueryKey],
    })
  }

  return (
    <>
      <h2 className="text-center">
        Your statements have been uploaded successfully
      </h2>

      <p className="text-center text-muted-foreground">
        {returnTo
          ? "Your credit limit has been updated. You can now proceed with your loan request."
          : "We are analyzing your statements and will notify you once your increased credit limit has been approved"}
      </p>

      <Button className="w-full mt-5" onClick={handleContinue}>
        {returnTo ? "Continue with Loan" : "Back to Dashboard"}
      </Button>
    </>
  )
}
