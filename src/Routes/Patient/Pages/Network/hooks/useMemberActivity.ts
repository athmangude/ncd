import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export type MemberActivityItem =
  | {
      kind: "transaction"
      id: string
      direction: "sent" | "received"
      amount: number
      currencyCode: string
      counterpartFirstName: string
      counterpartLastName: string
      description: string | null
      createdAt: string
    }
  | {
      kind: "joined"
      id: string
      firstName: string
      createdAt: string
    }

interface CareFundTransactionsResponse {
  data: Array<{
    id: string
    transactionAmount: number
    currency: { code: string }
    type: string
    sender: { accountOwner: { id: string; firstName: string; lastName: string } } | null
    receiver: { accountOwner: { id: string; firstName: string; lastName: string } } | null
    description: string | null
    createdAt: string
  }>
}

export interface UseMemberActivityOpts {
  joinedAt: string | null
  firstName: string
}

export function useMemberActivity(memberId: string, opts: UseMemberActivityOpts) {
  const query = useQuery({
    queryKey: ["careFundTransactions"],
    queryFn: async () => {
      const response = await axios.get<CareFundTransactionsResponse>(
        `${import.meta.env.VITE_API_BASE_URL}/care-fund/transactions`,
      )
      return response.data
    },
    staleTime: 60 * 1000,
  })

  const items: MemberActivityItem[] = []
  const transactions = query.data?.data ?? []
  for (const tx of transactions) {
    const isSenderMember = tx.sender?.accountOwner?.id === memberId
    const isReceiverMember = tx.receiver?.accountOwner?.id === memberId
    if (!isSenderMember && !isReceiverMember) continue
    const direction: "sent" | "received" = isReceiverMember ? "sent" : "received"
    const counterpart = isReceiverMember ? tx.receiver : tx.sender
    items.push({
      kind: "transaction",
      id: tx.id,
      direction,
      amount: tx.transactionAmount,
      currencyCode: tx.currency?.code ?? "KES",
      counterpartFirstName: counterpart?.accountOwner.firstName ?? "",
      counterpartLastName: counterpart?.accountOwner.lastName ?? "",
      description: tx.description,
      createdAt: tx.createdAt,
    })
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (opts.joinedAt) {
    items.push({
      kind: "joined",
      id: `joined-${memberId}`,
      firstName: opts.firstName,
      createdAt: opts.joinedAt,
    })
  }

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
