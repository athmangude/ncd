import PatientPageWrapper from "../PatientPageWrapper"
import { PaymentCard } from "@/components/YourPayments"
import { LoanCard } from "../../components/YourTreatments"
import { CashbackCard } from "@/components/CashbackCard"
import {
  TransactionHistoryList,
  TransactionHistoryEmptyState,
} from "@/components/TransactionHistoryList"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { usePaymentHistory } from "../../hooks/usePaymentHistory"

export default function PatientPaymentHistory() {
  const navigate = useNavigate()
  const { data: paymentHistory } = usePaymentHistory()
  const payments = paymentHistory?.payments || []
  const loans = paymentHistory?.loans || []

  const [activeTab, setActiveTab] = useState<"payments" | "loans" | "cashback">(
    "payments"
  )

  // Cashback / care-fund transactions — same source as CareFundTransactions.
  const { data: cashbackData, isLoading: isLoadingCashback } = useQuery({
    queryKey: ["careFundTransactions"],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/care-fund/transactions`
        )
        return response.data
      } catch (err) {
        console.error("Error fetching transactions:", err)
        throw err
      }
    },
  })
  const cashbackTransactions = cashbackData?.data || []

  const tabs = [
    { id: "payments", label: "All Payments" },
    { id: "loans", label: "Loans" },
    { id: "cashback", label: "Cashback" },
  ] as const

  return (
    <PatientPageWrapper
      title="Payment History"
      onBack={() => navigate("/patients", { state: { tab: "profile" } })}
      rightAction={<Search className="w-5 h-5 text-muted-foreground" />}
      footer={null}
    >
      <div className="flex flex-col gap-5">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {activeTab === tab.id && <Check className="w-4 h-4 text-white" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content — one shared list layout per tab, only the row differs. */}
        {activeTab === "payments" && (
          <TransactionHistoryList
            items={payments}
            getKey={(payment: any) => payment.id}
            getDate={(payment: any) => payment.createdAt}
            renderItem={(payment: any) => <PaymentCard payment={payment} />}
            emptyState={
              <TransactionHistoryEmptyState message="No payment history found." />
            }
          />
        )}

        {activeTab === "loans" && (
          <TransactionHistoryList
            items={loans}
            getKey={(loan: any) => loan.id}
            getDate={(loan: any) => loan.createdAt}
            renderItem={(loan: any) => (
              <LoanCard
                loanId={loan.id}
                status={loan.status}
                hospitalName={
                  loan?.patientMedicalInfoRequest?.facility?.name ||
                  "Unknown Provider"
                }
                createdAt={loan.createdAt}
                outStandingAmount={loan.outstandingAmount}
                currency={loan.currency.code}
                amount={loan.amount}
                dueDate={loan.loanDueDate}
              />
            )}
            emptyState={
              <TransactionHistoryEmptyState message="No loan history found." />
            }
          />
        )}

        {activeTab === "cashback" && (
          <TransactionHistoryList
            items={cashbackTransactions}
            isLoading={isLoadingCashback}
            getKey={(transaction: any) => transaction.id}
            getDate={(transaction: any) => transaction.createdAt}
            renderItem={(transaction: any) => (
              <CashbackCard transaction={transaction} />
            )}
            emptyState={
              <TransactionHistoryEmptyState message="No cashback history found." />
            }
          />
        )}
      </div>
    </PatientPageWrapper>
  )
}
