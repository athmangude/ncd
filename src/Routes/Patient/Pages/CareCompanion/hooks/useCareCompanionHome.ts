import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { CareCompanionHome, RefillScheduleItem, TestScheduleItem } from "@/types/care-companion"

export const careCompanionHomeQueryKey = "careCompanionHome"

const DAY_MS = 86_400_000

function computeRefillStatus(daysUntil: number, dbStatus: string) {
  if (dbStatus === "COMPLETED" || dbStatus === "CANCELLED") return dbStatus
  if (daysUntil <= 0) return "OVERDUE"
  if (daysUntil <= 3) return "DUE_SOON"
  return "UPCOMING"
}

async function fetchFromSupabase(): Promise<CareCompanionHome> {
  const now = new Date()
  const year = now.getFullYear()
  const yearStart = new Date(year, 0, 1).toISOString()

  const [refillRes, testRes, paymentsRes, contentRes, progressRes] =
    await Promise.all([
      supabase
        .from("refill_schedules")
        .select("*")
        .order("next_date", { ascending: true }),
      supabase
        .from("test_schedules")
        .select("*")
        .order("next_date", { ascending: true }),
      supabase
        .from("payments")
        .select("amount, cashback_amount, created_at")
        .gte("created_at", yearStart)
        .order("created_at", { ascending: false }),
      supabase
        .from("education_content")
        .select(
          "id, slug, title, category, conditions, content_type, summary, body, sections, estimated_minutes, learning_objectives, image_theme",
        )
        .order("created_at", { ascending: true }),
      supabase
        .from("education_progress")
        .select("content_id, completed")
        .eq("completed", true),
    ])

  const refillSchedules = (refillRes.data ?? []).map((r: any) => {
    const days = Math.ceil(
      (new Date(r.next_date).getTime() - now.getTime()) / DAY_MS,
    )
    return {
      id: r.id,
      medicationName: r.medication_name,
      expectedRefillDate: r.next_date,
      status: computeRefillStatus(days, r.status),
      daysUntilRefill: days,
      estimatedDaysSupply: r.frequency_days,
      escalatedToLoanOffer: false,
    }
  })

  const testSchedules = (testRes.data ?? []).map((t: any) => {
    const days = Math.ceil(
      (new Date(t.next_date).getTime() - now.getTime()) / DAY_MS,
    )
    return {
      id: t.id,
      testName: t.test_name,
      expectedDate: t.next_date,
      status: computeRefillStatus(days, t.status),
      daysUntilTest: days,
      frequencyMonths: t.frequency_months,
    }
  })

  const payments = paymentsRes.data ?? []
  const totalSpend = payments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0,
  )
  const totalCashback = payments.reduce(
    (sum: number, p: any) => sum + Number(p.cashback_amount ?? 0),
    0,
  )
  const monthsElapsed = now.getMonth() + 1
  const monthlyAvg = monthsElapsed > 0 ? totalSpend / monthsElapsed : 0
  const annualProjection = monthlyAvg * 12

  const costSummary = {
    year,
    ytdSpend: String(Math.round(totalSpend)),
    monthlyAverage: String(Math.round(monthlyAvg)),
    cashbackEarned: String(Math.round(totalCashback)),
    netSpend: String(Math.round(totalSpend - totalCashback)),
    annualProjection: String(Math.round(annualProjection)),
    transactionCount: payments.length,
    currency: "KES" as const,
  }

  const completedIds = new Set(
    (progressRes.data ?? []).map((p: any) => p.content_id),
  )
  const allContent = contentRes.data ?? []
  const nextContent = allContent.find(
    (c: any) => !completedIds.has(c.id),
  )

  const educationFeed = nextContent
    ? {
        id: nextContent.id,
        slug: nextContent.slug,
        conditionType: (nextContent.conditions?.[0] ?? "DIABETES") as any,
        contentType: nextContent.content_type as any,
        locale: "en-KE" as any,
        title: nextContent.title,
        summary: nextContent.summary ?? "",
        body: nextContent.body,
        sections: nextContent.sections ?? [],
        estimatedMinutes: nextContent.estimated_minutes ?? 5,
        learningObjectives: nextContent.learning_objectives ?? [],
        weekNumber: 1,
        imageUrl: nextContent.image_theme ?? null,
        isPublished: true,
        householdCompatible: null,
        costNeutral: null,
      }
    : null

  return {
    refillSchedule: { schedules: refillSchedules as RefillScheduleItem[], hasMore: false },
    testSchedule: { schedules: testSchedules as TestScheduleItem[], hasMore: false },
    costSummary,
    educationFeed,
    emergencyCard: {
      conditionType: "DIABETES",
      title: "Diabetic Emergency Card",
      cardId: "emergency-diabetes",
    },
    emergencyTransportCredit: null,
  }
}

export function useCareCompanionHome() {
  return useQuery({
    queryKey: [careCompanionHomeQueryKey],
    queryFn: fetchFromSupabase,
    staleTime: 5 * 60 * 1000,
  })
}
