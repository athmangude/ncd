import { useQuery } from "@tanstack/react-query"
import type { PaymentEvent } from "@/types/care-companion"

interface RecentPaymentsResponse {
  data: PaymentEvent[]
  pagination: { total: number; limit: number; offset: number }
}

export function useRecentPayments() {
  return useQuery({
    queryKey: ["care-companion", "recent-payments"],
    queryFn: async () => {
      const res = await fetch("/companion/events?type=PAYMENT&limit=10")
      if (!res.ok) return []
      const json = (await res.json()) as RecentPaymentsResponse
      const payments = (json.data ?? json) as PaymentEvent[]
      return payments.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
    },
    staleTime: 30_000,
  })
}
