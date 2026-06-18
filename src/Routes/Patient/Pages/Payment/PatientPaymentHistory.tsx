import { usePatientAuthStore } from "../../stores/patientAuthStore"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import { PaymentCard } from "@/components/YourPayments"
import { LoanCard } from "../../components/YourTreatments"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { formatMoney } from "@/utilities/currencyUtilities"
import { formatDateLong, formatTime } from "@/utilities/dateUtilities"
import { usePaymentHistory } from "../../hooks/usePaymentHistory"

export default function PatientPaymentHistory() {
  const navigate = useNavigate()
  const { data: paymentHistory } = usePaymentHistory()
  const payments = paymentHistory?.payments || []
  const loans = paymentHistory?.loans || []

  const [activeTab, setActiveTab] = useState<"payments" | "loans" | "cashback">("payments")

  // --- Payments Data ---
  const sortedPayments = payments ? [...payments].sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : []

  // --- Loans Data ---
  const sortedLoans = loans ? [...loans].sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : []

  // --- Cashback Data (Copied from CareFundTransactions) ---
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
    // Always fetch so data is ready when tab is clicked
  })

  const cashbackTransactions = cashbackData?.data || []
  const sortedCashback = [...cashbackTransactions].sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // --- Grouping Logic ---
  const groupItemsByDate = (items: any[]) => {
    const groups: { date: string; items: any[] }[] = []
    items.forEach((item) => {
      const groupKey = formatDateLong(item.createdAt)

      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.date === groupKey) {
        lastGroup.items.push(item)
      } else {
        groups.push({ date: groupKey, items: [item] })
      }
    })
    return groups
  }

  const groupedPayments = groupItemsByDate(sortedPayments)
  const groupedLoans = groupItemsByDate(sortedLoans)
  const groupedCashback = groupItemsByDate(sortedCashback)

  // --- Tabs Configuration ---
  const tabs = [
    { id: "payments", label: "All Payments" },
    { id: "loans", label: "Loans" },
    { id: "cashback", label: "Cashback" },
  ] as const

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title="Payment History"
          onBack={() => navigate("/patients", { state: { tab: "profile" } })}
          rightSlot={<Search className="w-5 h-5 text-neutral-600" />}
        />
      }
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
                  ? "bg-[#A855F7] text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
             {activeTab === tab.id && <Check className="w-4 h-4 text-white" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 pb-10">
          
          {/* Payments Tab */}
          {activeTab === "payments" && (
            groupedPayments.length > 0 ? (
              groupedPayments.map((group) => (
                <div key={group.date} className="flex flex-col gap-3">
                  <p className="text-sm text-neutral-500 font-medium ml-1">{group.date}</p>
                  <div className="flex flex-col gap-3">
                    {group.items.map((payment: any) => (
                      <PaymentCard key={payment.id} payment={payment} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No payment history found." />
            )
          )}

          {/* Loans Tab */}
          {activeTab === "loans" && (
            groupedLoans.length > 0 ? (
              groupedLoans.map((group) => (
                <div key={group.date} className="flex flex-col gap-3">
                  <p className="text-sm text-neutral-500 font-medium ml-1">{group.date}</p>
                  <div className="flex flex-col gap-3">
                    {group.items.map((loan: any) => (
                      <LoanCard
                        key={loan.id}
                        loanId={loan.id}
                        status={loan.status}
                        hospitalName={loan?.patientMedicalInfoRequest?.facility?.name || "Unknown Provider"}
                        createdAt={loan.createdAt}
                        outStandingAmount={loan.outstandingAmount}
                        currency={loan.currency.code}
                        amount={loan.amount}
                        dueDate={loan.loanDueDate}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No loan history found." />
            )
          )}

          {/* Cashback Tab */}
          {activeTab === "cashback" && (
            isLoadingCashback ? (
              <div className="text-center py-10 text-neutral-500">Loading transactions...</div>
            ) : groupedCashback.length > 0 ? (
              groupedCashback.map((group) => (
                <div key={group.date} className="flex flex-col gap-3">
                  <p className="text-sm text-neutral-500 font-medium ml-1">{group.date}</p>
                  <div className="flex flex-col gap-3">
                    {group.items.map((transaction: any) => (
                      <CashbackCard key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No cashback history found." />
            )
          )}

        </div>
      </div>
    </MobileWrapper>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center text-neutral-500 py-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
      {message}
    </div>
  )
}

function CashbackCard({ transaction }: { transaction: any }) {
  const user = usePatientAuthStore((state: any) => state.user)
  
  const isReceiver = transaction.receiver?.accountOwner?.id === user?.id
  const isSender = transaction.sender?.accountOwner?.id === user?.id

  let label = transaction.type.toLowerCase()

  if (transaction.type === "TRANSFER") {
    if (isReceiver) {
      label = `Received from ${transaction.sender?.accountOwner?.firstName || 'Unknown'}`
    } else if (isSender) {
      label = `Sent to ${transaction.receiver?.accountOwner?.firstName || 'Unknown'}`
    }
  } else if (transaction.type === "SPENT") {
    label = (transaction.description || "Spent").toLowerCase()
  } else if (transaction.type === "EARNED") {
    label = "Cashback earned" 
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex justify-between items-center">
      <div>
        <p className="text-base text-neutral-900 capitalize mb-1">
          {label}
        </p>
        <p className="text-sm text-neutral-500 flex items-center gap-2">
          <span>
            {formatMoney(
              transaction.transactionAmount,
              transaction.currency.code
            )}
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-400"></span>
          <span>
            {formatTime(transaction.createdAt)}
          </span>
        </p>
      </div>
      {/* <ChevronRight className="w-5 h-5 text-neutral-400" /> */}
      {/* Image shows specific icon for cashback, but we can use generic or none for now */}
    </div>
  )
}
