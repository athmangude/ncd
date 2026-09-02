import { useQuery } from "@tanstack/react-query"
import { useSupabase, supabase } from "@/lib/supabase"
import type { PaymentEvent } from "@/types/care-companion"

interface PaymentsResponse {
  data: PaymentEvent[]
  pagination: { total: number; limit: number; offset: number }
}

function fetchPayments(limit: number) {
  return async (): Promise<PaymentEvent[]> => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as unknown as PaymentEvent[]
    }

    const res = await fetch(`/companion/events?type=PAYMENT&limit=${limit}`)
    if (!res.ok) return []
    const json = (await res.json()) as PaymentsResponse
    const payments = (json.data ?? json) as PaymentEvent[]
    return payments.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }
}

export function useRecentPayments() {
  return useQuery({
    queryKey: ["care-companion", "recent-payments"],
    queryFn: fetchPayments(10),
    staleTime: 30_000,
  })
}

export function useAllPayments() {
  return useQuery({
    queryKey: ["care-companion", "all-payments"],
    queryFn: fetchPayments(500),
    staleTime: 30_000,
  })
}
