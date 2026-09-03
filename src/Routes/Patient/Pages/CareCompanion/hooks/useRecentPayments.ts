import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { PaymentEvent } from "@/types/care-companion"

interface SupabasePaymentRow {
  id: string
  facility_name: string
  facility_type: string | null
  amount: number
  currency: string
  line_items: PaymentEvent["lineItems"] | null
  funding_sources: PaymentEvent["fundingSources"] | null
  cashback_amount: number
  status: string
  created_at: string
}

function transformPaymentRow(row: SupabasePaymentRow): PaymentEvent {
  const rawItems = (row.line_items ?? []) as Array<Record<string, unknown>>
  const lineItems: PaymentEvent["lineItems"] = rawItems.map((li) => ({
    name: String(li.name ?? ""),
    category: (li.category ?? "SUPPLY") as PaymentEvent["lineItems"][number]["category"],
    quantity: Number(li.quantity ?? 1),
    unitPrice: Number(li.unitPrice ?? 0),
    lineTotal: Number(li.lineTotal ?? li.total ?? 0),
  }))

  const rawSources = (row.funding_sources ?? []) as Array<Record<string, unknown>>
  const fundingSources: PaymentEvent["fundingSources"] = rawSources.map((fs) => ({
    type: (fs.type ?? fs.source ?? "WALLET") as PaymentEvent["fundingSources"][number]["type"],
    amount: Number(fs.amount ?? 0),
  }))

  return {
    id: row.id,
    type: "PAYMENT",
    timestamp: row.created_at,
    source: "user",
    facilityName: row.facility_name,
    facilityType: (row.facility_type ?? "HOSPITAL") as PaymentEvent["facilityType"],
    totalAmount: Number(row.amount),
    currency: "KES",
    lineItems,
    fundingSources,
    isInNetwork: true,
  }
}

function fetchPayments(limit: number) {
  return async (): Promise<PaymentEvent[]> => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []).map((row) => transformPaymentRow(row as unknown as SupabasePaymentRow))
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
