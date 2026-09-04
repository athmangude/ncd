import { useNavigate, useParams } from "react-router-dom"
import { usePatientLoanStore } from "../../stores/patientLoanStore"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import { getPatientLoanDetailsQueryKey } from "./PatientViewLoanDetails"
import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { CircleCheck } from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import { formatTime } from "@/utilities/dateUtilities"
import { Button } from "@/components/Button"
import ReferralCTA from "../../components/ReferralCTA"
import useNextLoanApplicationStep from "../../hooks/useNextLoanApplicationStep"
import QueryWrapper from "@/components/QueryBlock"

export default function LoanCreationSuccess() {
  const id = useParams().id
  const setLoan = usePatientLoanStore((state: any) => state.setLoan)

  const { isLoading, error, data } = useQuery({
    queryKey: [getPatientLoanDetailsQueryKey],
    queryFn: async () => {
      const { data: loan, error: loanError } = await supabase
        .from("loans")
        .select("*")
        .eq("id", id)
        .single()
      if (loanError) throw loanError

      const currency = loan.currency as { code?: string } | null
      const patientMedicalInfoRequest = loan.patient_medical_info_request as Record<string, unknown> | null

      const mapped = {
        id: loan.id,
        amount: Number(loan.amount),
        totalBillAmount: Number(loan.total_bill_amount),
        outstandingAmount: Number(loan.outstanding_amount),
        status: loan.status,
        loanType: loan.loan_type,
        currency: currency ?? { code: "KES" },
        createdAt: loan.created_at,
        updatedAt: loan.created_at,
        patientMedicalInfoRequest,
        patientName: loan.patient_name,
        careProvider: (patientMedicalInfoRequest as Record<string, unknown> | null)?.facility ?? null,
      }

      setLoan(mapped)
      return mapped
    },
  })

  const navigate = useNavigate()
  const next = useNextLoanApplicationStep()

  return (
    <PatientPageWrapper
      isRoot={true}
      title="Summary"
      className="text-center flex "
    >
      <QueryWrapper isLoading={isLoading} error={error}>
        {data?.status === "SUBMITTED_FOR_APPROVAL" ? (
          <LoanSubmittedForApproval data={data} />
        ) : (
          <LoanDisbursed data={data} />
        )}
        <Button
          role="link"
          onClick={() => navigate(next)}
          className="w-full mt-5"
          size="lg"
        >
          Back To Dashboard
        </Button>
      </QueryWrapper>
    </PatientPageWrapper>
  )
}

function LoanSubmittedForApproval({ data }: { data: any }) {
  const { totalBillAmount, currency, careProvider } = data || {}

  return (
    <>
      <CircleCheck className={`mx-auto text-green-500 ${HERO_ILLUSTRATION}`} />
      <h1>Your Payment Has Been Submitted For Approval</h1>

      <p>
        We will send you a link to complete the disbursement of{" "}
        <span className="font-medium">
          {formatMoney(totalBillAmount, currency?.code)}
        </span>{" "}
        to <span className="font-medium">{careProvider?.name}</span>
        once we have approved your request.
      </p>
    </>
  )
}

function LoanDisbursed({ data }: { data: any }) {
  const {
    totalBillAmount,
    currency,
    updatedAt,
    careProvider,
    patientMedicalInfoRequest,
  } = data || {}

  return (
    <>
      <CircleCheck className={`mx-auto text-green-500 ${HERO_ILLUSTRATION}`} />
      <h1>Payment Successful!</h1>

      <p>
        <span className="font-medium">
          {formatMoney(totalBillAmount, currency?.code)}
        </span>{" "}
        has been paid to{" "}
        <span className="font-medium">{careProvider?.name}</span> at{" "}
        <span className="font-medium">{formatTime(updatedAt)}</span> for{" "}
        {patientMedicalInfoRequest?.patientName}
      </p>

      <ReferralCTA />
    </>
  )
}
