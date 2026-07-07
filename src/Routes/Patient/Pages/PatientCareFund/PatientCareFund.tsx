import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { Banknote, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/Button"
import useNextLoanApplicationStep from "../../hooks/useNextLoanApplicationStep"
import { useNavigate } from "react-router-dom"
import { CareFundCard } from "./components/CareFundCard"
import { CareFundTransactions } from "./components/CareFundTransactions"
import PatientPageWrapper from "../PatientPageWrapper"
import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
export default function PatientCareFundPage() {
  return (
    <PatientPageWrapper title="Your Care Fund">
      <PatientCareFund />
    </PatientPageWrapper>
  )
}

export function PatientCareFund() {
  const next = useNextLoanApplicationStep()

  const user = usePatientAuthStore((state: any) => state.user)
  const { canPayMedicalBill } = user || {}

  const { data: paymentHistory } = usePaymentHistory()
  const careFundAccount = paymentHistory?.careFundAccount

  return (
    <>
      <div className="flex flex-col gap-4">
        <CareFundCard />
        {canPayMedicalBill && careFundAccount && (
          <section className="grid grid-cols-2 gap-4">
            <CareFundCTA
              icon={<Banknote className="w-8 h-8 text-primary font-sm" />}
              title="Redeem"
              link={next}
            />

            <CareFundCTA
              icon={<ArrowUpRight className="w-8 h-8 text-primary" />}
              title="Share"
              link="/patients/care-fund/gift-recipient"
            />
          </section>
        )}

        <CareFundTransactions />
      </div>
    </>
  )
}

function CareFundCTA({
  icon,
  title,
  link,
}: {
  icon: React.ReactNode
  title: string
  link: string
}) {
  const navigate = useNavigate()

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => navigate(link)}
    >
      {icon}
      {title}
    </Button>
  )
}
