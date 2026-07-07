import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import {
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Activity,
} from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import { formatTime } from "@/utilities/dateUtilities"
import { usePatientAuthStore } from "../../../stores/patientAuthStore"
import PatientCareFundExplainer from "../PatientCareFundExplainer"
import { Skeleton } from "@/components/Skeleton"

interface CareFundTransaction {
  id: string
  transactionAmount: number
  currency: { code: string; symbol?: string; name?: string }
  type: "TRANSFER" | "EARNED" | "SPENT"
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED"
  sender: {
    accountOwner: { id: string; firstName: string; lastName: string }
  } | null
  receiver: {
    accountOwner: { id: string; firstName: string; lastName: string }
  } | null
  receiverPhoneNumber: string | null
  description: string | null
  loan: any | null
  createdAt: string
  updatedAt: string
  expiresAt: string | null
}

interface CareFundTransactionsResponse {
  message: string
  data: CareFundTransaction[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function CareFundTransactions() {
  const user = usePatientAuthStore((state: any) => state.user)

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

  // Group transactions by date
  const groupedTransactions =
    transactionsData?.data?.reduce(
      (
        acc: { date: string; transactions: CareFundTransaction[] }[],
        transaction
      ) => {
        const date = format(new Date(transaction.createdAt), "dd MMM yyyy")
        const existingGroup = acc.find((group) => group.date === date)
        if (existingGroup) {
          existingGroup.transactions.push(transaction)
        } else {
          acc.push({ date, transactions: [transaction] })
        }
        return acc
      },
      []
    ) || []

  if (isLoadingTransactions) {
    return (
      <div className="mt-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex flex-col gap-6">
          {[1, 2].map((groupIndex) => (
            <div key={groupIndex}>
              <Skeleton className="h-4 w-20 ml-1 mb-2" />
              <div className="flex flex-col gap-3">
                {[1, 2, 3]
                  .slice(0, groupIndex === 0 ? 3 : 2)
                  .map((rowIndex) => (
                    <div
                      key={rowIndex}
                      className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-3"
                    >
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <Skeleton className="h-4 w-3/4 max-w-[12rem]" />
                        <Skeleton className="h-3 w-1/2 max-w-[8rem]" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-8 text-red-500 text-sm">
        Failed to load transactions. Please try again later.
      </div>
    )
  }

  if (!transactionsData?.data?.length) {
    return <PatientCareFundExplainer />
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4">Transactions History</h2>
      <div className="flex flex-col gap-6">
        {groupedTransactions.map((group) => (
          <div key={group.date}>
            <h3 className="text-muted-foreground mb-2 ml-1">{group.date}</h3>
            <div className="flex flex-col gap-3">
              {group.transactions.map((transaction) => {
                const isReceiver =
                  transaction.receiver?.accountOwner?.id === user?.id
                const isSender =
                  transaction.sender?.accountOwner?.id === user?.id

                const getTransactionIcon = () => {
                  switch (transaction.type) {
                    case "EARNED":
                      return (
                        <div className="p-1">
                          <TrendingUp className="w-5 h-5 " />
                        </div>
                      )
                    case "SPENT":
                      return (
                        <div className="p-1">
                          <CreditCard className="w-5 h-5 " />
                        </div>
                      )
                    case "TRANSFER":
                      if (isReceiver) {
                        return (
                          <div className="p-2  rounded-full">
                            <ArrowDownLeft className="w-5 h-5 " />
                          </div>
                        )
                      }
                      if (isSender) {
                        return (
                          <div className="p-1">
                            <ArrowUpRight className="w-5 h-5 t" />
                          </div>
                        )
                      }
                      return (
                        <div className="p-1">
                          <ArrowRightLeft className="w-5 h-5 " />
                        </div>
                      )
                    default:
                      return (
                        <div className="p-1">
                          <Activity className="w-5 h-5 " />
                        </div>
                      )
                  }
                }

                return (
                  <div
                    key={transaction.id}
                    className="bg-white p-4 rounded-xl border border-border shadow-sm flex justify-between items-center"
                  >
                    <div className="flex items-center text-foreground gap-2">
                      {getTransactionIcon()}
                      <div>
                        <p className="text-foreground capitalize mb-1 ">
                          {transaction.description?.toLowerCase()}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>
                            {formatMoney(
                              transaction.transactionAmount,
                              transaction.currency.code
                            )}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                          <span>{formatTime(transaction.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
