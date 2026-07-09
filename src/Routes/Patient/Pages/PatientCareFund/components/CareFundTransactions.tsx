import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { SectionTitle } from "@/components/SectionTitle"
import {
  TransactionHistoryList,
  TransactionHistoryListSkeleton,
} from "@/components/TransactionHistoryList"
import { CashbackCard } from "@/components/CashbackCard"
import type { CashbackTransaction } from "@/components/CashbackCard"
import PatientCareFundExplainer from "../PatientCareFundExplainer"

interface CareFundTransactionsResponse {
  message: string
  data: CashbackTransaction[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function CareFundTransactions() {
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError,
  } = useQuery({
    queryKey: ["careFundTransactions"],
    queryFn: async () => {
      try {
        const response = await axios.get<CareFundTransactionsResponse>(
          `${import.meta.env.VITE_API_BASE_URL}/care-fund/transactions`
        )
        return response.data
      } catch (err) {
        console.error("Error fetching transactions:", err)
        throw err
      }
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
