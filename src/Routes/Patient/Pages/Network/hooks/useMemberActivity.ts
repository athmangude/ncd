import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

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

export interface UseMemberActivityOpts {
  joinedAt: string | null
  firstName: string
}

export function useMemberActivity(memberId: string, opts: UseMemberActivityOpts) {
  const query = useQuery({
    queryKey: ["careFundTransactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_fund_transactions")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    staleTime: 60 * 1000,
  })

  const items: MemberActivityItem[] = []
  const transactions = query.data ?? []
  for (const tx of transactions) {
    const sender = tx.sender as {
      accountOwner: { id: string; firstName: string; lastName: string }
    } | null
    const receiver = tx.receiver as {
      accountOwner: { id: string; firstName: string; lastName: string }
    } | null
    const isSenderMember = sender?.accountOwner?.id === memberId
    const isReceiverMember = receiver?.accountOwner?.id === memberId
    if (!isSenderMember && !isReceiverMember) continue
    const direction: "sent" | "received" = isReceiverMember
      ? "sent"
      : "received"
    const counterpart = isReceiverMember ? receiver : sender
    const currency = tx.currency as { code?: string } | null
    items.push({
      kind: "transaction",
      id: tx.id,
      direction,
      amount: Number(tx.transaction_amount),
      currencyCode: currency?.code ?? "KES",
      counterpartFirstName: counterpart?.accountOwner.firstName ?? "",
      counterpartLastName: counterpart?.accountOwner.lastName ?? "",
      description: tx.description,
      createdAt: tx.created_at!,
    })
  }

  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

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
