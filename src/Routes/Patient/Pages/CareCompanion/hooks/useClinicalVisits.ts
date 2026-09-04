import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface LineItem {
  name: string
  category: "MEDICATION" | "LAB_TEST" | "CONSULTATION" | "SUPPLY" | "SUPPLIES"
  quantity: number
  unitPrice: number
  total: number
}

export interface ClinicalVisit {
  id: string
  date: string
  facilityName: string
  facilityType: "PHARMACY" | "LAB" | "HOSPITAL" | "CLINIC"
  totalAmount: number
  currency: string
  lineItems: LineItem[]
  fundingSources: { source: string; amount: number }[]
  cashbackAmount: number
  consultations: LineItem[]
  labs: LineItem[]
  prescriptions: LineItem[]
  supplies: LineItem[]
  hasLabResults: boolean
  testResultEvent: TestResultData | null
  aiInsight: string | null
  aiInsightsByTest: Record<string, string>
  labResultsByTest: Record<string, TestResultData>
}

export interface TestResultData {
  testName: string
  metrics: {
    name: string
    value: number
    unit: string
    referenceRange: string
    status: "NORMAL" | "LOW" | "HIGH" | "CRITICAL"
  }[]
  labName?: string
  date?: string
  paymentId?: string
  lineItemName?: string
  uploadedFilePath?: string
  source?: "generated" | "uploaded"
}

export interface ClinicalVisitsSummary {
  totalVisits: number
  facilitiesVisited: number
  dateRange: { from: string; to: string }
  totalSpent: number
  currency: string
}

export const clinicalVisitsQueryKey = "clinicalVisits"

export function useClinicalVisits() {
  const paymentsQuery = useQuery({
    queryKey: [clinicalVisitsQueryKey, "payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map((p: any) => ({
        id: p.id,
        date: p.created_at,
        facilityName: p.facility_name,
        facilityType: p.facility_type,
        totalAmount: Number(p.amount),
        currency: p.currency ?? "KES",
        lineItems: (p.line_items ?? []) as LineItem[],
        fundingSources: (p.funding_sources ?? []) as {
          source: string
          amount: number
        }[],
        cashbackAmount: Number(p.cashback_amount ?? 0),
      }))
    },
    staleTime: 2 * 60 * 1000,
  })

  const eventsQuery = useQuery({
    queryKey: [clinicalVisitsQueryKey, "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("type", ["TEST_RESULT", "AI_INSIGHT"])
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map((e: any) => ({
        id: e.id,
        type: e.type as "TEST_RESULT" | "AI_INSIGHT",
        timestamp: e.created_at,
        data: e.data ?? {},
      }))
    },
    staleTime: 2 * 60 * 1000,
  })

  const visits = useMemo((): ClinicalVisit[] => {
    const payments = paymentsQuery.data ?? []
    const events = eventsQuery.data ?? []

    const testResults = events.filter(
      (e: any) => e.type === "TEST_RESULT",
    )
    const aiInsights = events.filter(
      (e: any) => e.type === "AI_INSIGHT",
    )

    return payments.map((p: any) => {
      const items: LineItem[] = p.lineItems ?? []
      const consultations = items.filter(
        (i) => i.category === "CONSULTATION",
      )
      const labs = items.filter((i) => i.category === "LAB_TEST")
      const prescriptions = items.filter(
        (i) => i.category === "MEDICATION",
      )
      const supplies = items.filter(
        (i) => i.category === "SUPPLY" || i.category === "SUPPLIES",
      )

      const paymentDate = new Date(p.date)

      const exactResults = testResults.filter(
        (tr: any) => tr.data?.paymentId === p.id,
      )

      const labResultsByTest: Record<string, TestResultData> = {}
      for (const tr of exactResults) {
        const key = tr.data?.lineItemName ?? tr.data?.testName
        if (key) labResultsByTest[key] = tr.data as TestResultData
      }

      const matchedResult = labs.length > 0
        ? exactResults[0] ?? testResults.find((tr: any) => {
            if (tr.data?.paymentId) return false
            const trDate = new Date(tr.timestamp)
            const diffDays = Math.abs(
              (paymentDate.getTime() - trDate.getTime()) / 86_400_000,
            )
            return diffDays <= 14
          })
        : null

      const exactInsights = aiInsights.filter(
        (ai: any) => ai.data?.paymentId === p.id,
      )

      const aiInsightsByTest: Record<string, string> = {}
      for (const ai of exactInsights) {
        const key = ai.data?.lineItemName
        const body = ai.data?.body ?? ai.data?.title
        if (key && body) aiInsightsByTest[key] = body
      }

      const matchedInsight = exactInsights[0] ?? aiInsights.find((ai: any) => {
        if (ai.data?.paymentId) return false
        const aiDate = new Date(ai.timestamp)
        const diffDays = Math.abs(
          (paymentDate.getTime() - aiDate.getTime()) / 86_400_000,
        )
        return diffDays <= 14
      })

      return {
        id: p.id,
        date: p.date,
        facilityName: p.facilityName,
        facilityType: p.facilityType,
        totalAmount: p.totalAmount,
        currency: p.currency,
        lineItems: items,
        fundingSources: p.fundingSources,
        cashbackAmount: p.cashbackAmount,
        consultations,
        labs,
        prescriptions,
        supplies,
        hasLabResults: matchedResult != null || Object.keys(labResultsByTest).length > 0,
        testResultEvent: matchedResult
          ? (matchedResult.data as TestResultData)
          : null,
        aiInsight: matchedInsight?.data?.body ?? matchedInsight?.data?.title ?? null,
        aiInsightsByTest,
        labResultsByTest,
      } as ClinicalVisit
    })
  }, [paymentsQuery.data, eventsQuery.data])

  const summary = useMemo((): ClinicalVisitsSummary => {
    const facilities = new Set(visits.map((v) => v.facilityName))
    const dates = visits.map((v) => v.date).sort()
    const totalSpent = visits.reduce((sum, v) => sum + v.totalAmount, 0)
    return {
      totalVisits: visits.length,
      facilitiesVisited: facilities.size,
      dateRange: {
        from: dates[0] ?? "",
        to: dates[dates.length - 1] ?? "",
      },
      totalSpent,
      currency: "KES",
    }
  }, [visits])

  return {
    visits,
    summary,
    isLoading: paymentsQuery.isLoading || eventsQuery.isLoading,
    error: paymentsQuery.error ?? eventsQuery.error,
    isFetching: paymentsQuery.isFetching || eventsQuery.isFetching,
  }
}
