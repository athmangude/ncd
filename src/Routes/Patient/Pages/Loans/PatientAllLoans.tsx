import AmountContainer from "../../components/AmountContainer"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import PatientPageWrapper from "../PatientPageWrapper"
import { Amount } from "@/components/Amount"
import { SectionTitle } from "@/components/SectionTitle"
import CopyButton from "@/components/CopyButton"
import YourTreatments from "../../components/YourTreatments"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
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
        const { data, error } = await supabase
          .from("loans")
          .select("outstanding_amount, currency")
        if (error) throw error
        const totalOutstanding = (data ?? []).reduce(
          (sum, l) => sum + Number(l.outstanding_amount ?? 0),
          0,
        )
        const currency =
          (data?.[0]?.currency as { code?: string })?.code || "KES"
        setLoanStats({
          outstandingAmount: totalOutstanding,
          currency,
        })
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
        <SectionTitle>Total To Repay</SectionTitle>
        <Amount
          value={loanStats?.outstandingAmount ?? 0}
          currency={loanStats?.currency || "KES"}
          size="hero"
          weight="bold"
        />
      </section>

      <section className="flex flex-col gap-3 my-5 bg-primary/5 p-5 rounded-xl border-primary border">
        <SectionTitle>How to Repay</SectionTitle>

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
