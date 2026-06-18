import AmountContainer from "../../components/AmountContainer"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import PatientPageWrapper from "../PatientPageWrapper"
import { formatMoney } from "@/utilities/currencyUtilities"
import CopyButton from "@/components/CopyButton"
import YourTreatments from "../../components/YourTreatments"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"
import { trackEvent, EVENTS } from "@/analytics"
import { LoanStats } from "@/types/LoanStats"

export default function PatientAllLoans() {
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user)
  const { accountReference } = user || {}
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null)

  useEffect(() => {
    try {
      trackEvent(EVENTS.LOAN_REPAYMENT.ALL_LOANS_VIEW, {
        loanCount: user?.loans?.length ?? 0,
      })
    } catch {
      // Silent fail
    }

    const fetchLoanStats = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/loans/patient/me/stats`
        )
        if (response.data) {
          setLoanStats(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch loan stats", error)
      }
    }
    fetchLoanStats()
    // Mount-only: fire view event once and fetch initial stats; loan-count changes should not re-fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <PatientPageWrapper
      title="All Loans"
      onBack={() =>
        navigate("/patients", { state: { tab: "home", subTab: "loans" } })
      }
    >
      <section className="text-center flex flex-col gap-1">
        <h1 className="font-normal text-neutral-600">Total To Repay</h1>
        <p className="text-3xl font-medium">
          {formatMoney(
            loanStats?.outstandingAmount ?? 0,
            loanStats?.currency || "KES"
          )}
        </p>
      </section>

      <section className="flex flex-col gap-3 my-5 bg-primary/5 p-5 rounded-xl border-primary border">
        <h1 className="font-me">How to Repay</h1>

        <div className="flex justify-between items-baseline">
          <AmountContainer leftText="Pay Bill No." rightText="4159861" />

          <CopyButton text="4159861" />
        </div>

        <div className="flex justify-between items-baseline">
          <AmountContainer
            leftText="Account No."
            rightText={accountReference}
          />
          <CopyButton text={accountReference} />
        </div>
      </section>

      {user?.loans?.length > 0 && <YourTreatments />}
    </PatientPageWrapper>
  )
}
