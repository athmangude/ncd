import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { SectionTitle } from "@/components/SectionTitle"
import {
  TransactionHistoryList,
  TransactionHistoryListSkeleton,
} from "@/components/TransactionHistoryList"
import { CashbackCard } from "@/components/CashbackCard"
import type { CashbackTransaction } from "@/components/CashbackCard"
import PatientCareFundExplainer from "../PatientCareFundExplainer"


export function CareFundTransactions() {
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError,
  } = useQuery({
    queryKey: ["careFundTransactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_fund_transactions")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      const transactions: CashbackTransaction[] = (data ?? []).map((row: any) => ({
        id: row.id,
        transactionAmount: Number(row.transaction_amount),
        currency: row.currency,
        type: row.type,
        status: row.status,
        sender: row.sender,
        receiver: row.receiver,
        receiverPhoneNumber: row.receiver_phone_number,
        description: row.description,
        loan: row.loan,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        expiresAt: row.expires_at,
      }))
      return { message: "ok", data: transactions, meta: { total: transactions.length, page: 1, limit: 100, totalPages: 1 } }
    },
    enabled: true,
  })

  if (isLoadingTransactions) {
    return (
      <div className="mt-8">
        <SectionTitle className="mb-4">Transactions History</SectionTitle>
        <TransactionHistoryListSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-8 text-destructive text-sm">
        Failed to load transactions. Please try again later.
      </div>
    )
  }

  const transactions = transactionsData?.data ?? []

  if (!transactions.length) {
    return <PatientCareFundExplainer />
  }

  return (
    <div className="mt-8">
      <SectionTitle className="mb-4">Transactions History</SectionTitle>
      <TransactionHistoryList
        items={transactions}
        getKey={(transaction) => transaction.id}
        getDate={(transaction) => transaction.createdAt}
        renderItem={(transaction) => <CashbackCard transaction={transaction} />}
      />
    </div>
  )
}
