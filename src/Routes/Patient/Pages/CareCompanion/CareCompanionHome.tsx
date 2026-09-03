import { lazy, Suspense, useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  Calendar,
  Check,
  ChevronRight,
  TrendingUp,
  Shield,
  BookOpen,
  AlertTriangle,
  Loader2,
  Clock,
  Sparkles,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import {
  useMedicationTaxonomy,
  getMedicationPrice,
} from "@/hooks/useMedicationTaxonomy"
import { SectionErrorBoundary } from "./components/SectionErrorBoundary"
import { EmergencyCardStaticFallback } from "./components/EmergencyCardStaticFallback"
import { MedicationCardDrawer } from "./components/MedicationCardDrawer"
import { AddMedicationDrawer } from "./components/AddMedicationDrawer"
import { useCareCompanionHome } from "./hooks/useCareCompanionHome"
import { useIntakeProfile, intakeProfileQueryKey } from "./hooks/useIntakeProfile"
import { refillScheduleQueryKey } from "./hooks/useRefillSchedule"
import { useAiPipeline } from "./hooks/useAiPipeline"
import { useMedicationCards } from "./hooks/useMedicationCards"
import type { AnnotatedMedicationCard } from "./hooks/useMedicationCards"
import { useNotifications } from "./hooks/useNotifications"

const CareCompanionIntake = lazy(() => import("./Intake/CareCompanionIntake"))
import type { CareCompanionHome as CareCompanionHomeData } from "@/types/care-companion"

const CHALLENGE_LABELS: Record<string, string> = {
  COST: "managing costs",
  UNDERSTANDING_MEDICATION: "understanding your medication",
  DIET: "eating well on a budget",
  EXERCISE: "staying active",
  SIDE_EFFECTS: "managing side effects",
  FINDING_PHARMACY: "finding your medication",
  EMOTIONAL: "emotional wellbeing",
  FAMILY_SUPPORT: "getting family support",
  EMERGENCY_PREPAREDNESS: "emergency readiness",
  NAVIGATING_SYSTEM: "navigating healthcare",
  STIGMA: "acceptance",
}

const SECTION_ORDER_BY_CHALLENGE: Record<string, string[]> = {
  COST: ["cost", "refill", "emergency", "education"],
  UNDERSTANDING_MEDICATION: ["education", "refill", "cost", "emergency"],
  DIET: ["education", "cost", "refill", "emergency"],
  EXERCISE: ["education", "refill", "cost", "emergency"],
  EMERGENCY_PREPAREDNESS: ["emergency", "refill", "cost", "education"],
  FINDING_PHARMACY: ["refill", "cost", "emergency", "education"],
}

export default function CareCompanionHome() {
  const { data: profile, isLoading: profileLoading } = useIntakeProfile()
  const { data, isLoading, error } = useCareCompanionHome()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addMedOpen, setAddMedOpen] = useState(false)
  const { data: medCardsData } = useMedicationCards()
  const { data: taxonomyData = [] } = useMedicationTaxonomy()
  useAiPipeline(profile ?? null)
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const unreadInsights = notifications.filter(
    (n) => n.type === "AI_INSIGHT" && !n.readAt,
  )

  if (profileLoading || isLoading) {
    return <CareCompanionHomeSkeleton />
  }

  if (!profile?.completedAt) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CareCompanionIntake />
      </Suspense>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load your care dashboard.
        </p>
      </div>
    )
  }

  const topChallenge = profile?.challenges?.topChallenge ?? null
  const sectionOrder =
    (topChallenge && SECTION_ORDER_BY_CHALLENGE[topChallenge]) ||
    ["refill", "cost", "emergency", "education"]

  const medPriceMap: Record<string, number> = {}
  for (const m of profile?.costEstimates?.medications ?? []) {
    medPriceMap[m.name.toLowerCase()] = m.estimatedCostPerRefill
  }
  for (const s of data.refillSchedule?.schedules ?? []) {
    const key = s.medicationName.toLowerCase()
    if (medPriceMap[key] == null) {
      medPriceMap[key] = getMedicationPrice(taxonomyData,s.medicationName)
    }
  }
  const testPriceMap: Record<string, number> = {}
  for (const t of profile?.costEstimates?.tests ?? []) {
    testPriceMap[t.name.toLowerCase()] = t.estimatedCostPerTest
  }
  for (const t of data.testSchedule?.schedules ?? []) {
    const key = t.testName.toLowerCase()
    if (testPriceMap[key] == null) {
      testPriceMap[key] = getMedicationPrice(taxonomyData,t.testName)
    }
  }

  const sections: Record<string, React.ReactNode> = {
    refill: (
      <SectionErrorBoundary key="refill" sectionName="Refill Schedule">
        <RefillScheduleCard
          data={data}
          medicationPrices={medPriceMap}
          testPrices={testPriceMap}
          medicationCards={medCardsData?.cards ?? []}
          profile={profile ?? null}
          onAddMedication={() => setAddMedOpen(true)}
        />
      </SectionErrorBoundary>
    ),
    cost: (
      <SectionErrorBoundary key="cost" sectionName="Cost Tracker">
        <CostTrackerCard data={data} />
      </SectionErrorBoundary>
    ),
    emergency: (
      <SectionErrorBoundary
        key="emergency"
        sectionName="Emergency Card"
        fallbackContent={<EmergencyCardStaticFallback />}
      >
        <EmergencyCardCard data={data} />
      </SectionErrorBoundary>
    ),
    education: (
      <SectionErrorBoundary key="education" sectionName="Education">
        <EducationCard data={data} />
      </SectionErrorBoundary>
    ),
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {profile?.completedAt && <ProfileGreeting profile={profile} />}

      {unreadInsights.length > 0 && (
        <button
          type="button"
          onClick={() => navigate("/patients/notifications")}
          className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-left transition-colors active:bg-primary/10"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {`${unreadInsights.length} new insight${unreadInsights.length === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Tap to view in notifications
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      {sectionOrder.map((key) => sections[key])}

      <QuickActions />

      <AiAssistantFab />

      <MedicationCardDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialMedicationId={undefined}
      />

      <AddMedicationDrawer
        open={addMedOpen}
        onOpenChange={setAddMedOpen}
        existingMedications={
          profile?.treatment?.medicationNames ?? []
        }
      />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-2/5 rounded bg-muted" />
          <div className="h-3 w-3/5 rounded bg-muted" />
        </div>
        <div className="h-5 w-5 rounded bg-muted" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-1.5">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-1.5">
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-3 w-2/5 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

function CareCompanionHomeSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="rounded-xl bg-muted/40 px-4 py-3">
        <div className="h-4 w-4/5 rounded bg-muted" />
      </div>

      <SkeletonCard />
      <SkeletonCard />

      <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-red-100/50" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-2/5 rounded bg-red-100/50" />
            <div className="h-3 w-4/5 rounded bg-red-100/50" />
          </div>
        </div>
      </div>

      <SkeletonCard />

      <div>
        <div className="mb-2 h-3 w-24 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3"
            >
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileGreeting({
  profile,
}: {
  profile: {
    conditions?: { type?: string[] }
    challenges?: { topChallenge?: string | null }
    userRole?: { role?: string }
  }
}) {
  const navigate = useNavigate()
  const conditions = profile.conditions?.type ?? []
  const topChallenge = profile.challenges?.topChallenge
  const isSelf = profile.userRole?.role === "SELF"

  const conditionNames: Record<string, string> = {
    DIABETES: "diabetes",
    HYPERTENSION: "hypertension",
    CANCER: "cancer",
    ASTHMA: "asthma",
    HEART_DISEASE: "heart disease",
    KIDNEY_DISEASE: "kidney disease",
    HIV: "HIV",
    EPILEPSY: "epilepsy",
    SICKLE_CELL: "sickle cell",
    OTHER: "your condition",
  }

  const conditionText =
    conditions.length > 0
      ? conditions
          .slice(0, 2)
          .map((c) => conditionNames[c] ?? c.toLowerCase())
          .join(" & ")
      : null

  const challengeText = topChallenge
    ? CHALLENGE_LABELS[topChallenge]
    : null

  return (
    <div className="rounded-xl bg-primary/5 px-4 py-3">
      <p className="text-sm text-foreground">
        {conditionText ? (
          <>
            Your dashboard is personalised for{" "}
            {isSelf ? "your" : "your patient's"}{" "}
            <span className="font-semibold">{conditionText}</span> care
            {challengeText && (
              <>
                , focused on{" "}
                <span className="font-semibold">{challengeText}</span>
              </>
            )}
            .
          </>
        ) : (
          <>Your care dashboard is ready.</>
        )}{" "}
        <button
          type="button"
          onClick={() => navigate("/patients/companion/intake")}
          className="inline text-xs font-medium text-primary hover:underline"
        >
          Update profile
        </button>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Refill Schedule Card
// ---------------------------------------------------------------------------

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    MEDICATION: "Medication",
    LAB_TEST: "Lab Test",
    CONSULTATION: "Consultation",
    SUPPLY: "Supply",
  }
  return labels[category] ?? category
}

function findMatchingCard(
  name: string,
  cards: AnnotatedMedicationCard[],
): AnnotatedMedicationCard | undefined {
  const lower = name.toLowerCase()
  return (
    cards.find((c) => c.genericName.toLowerCase() === lower) ??
    cards.find((c) => c.genericName.toLowerCase().includes(lower)) ??
    cards.find((c) => lower.includes(c.genericName.toLowerCase())) ??
    cards.find(
      (c) => c.slug === lower.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    )
  )
}

const FREQUENCY_OPTIONS = [
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Every 30 days" },
  { value: 60, label: "Every 60 days" },
  { value: 90, label: "Every 90 days" },
]

const TEST_FREQUENCY_OPTIONS = [
  { value: 1, label: "Monthly" },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 12, label: "Yearly" },
]

const CHANGE_REASONS = [
  { value: "doctor_recommendation", label: "Doctor recommended" },
  { value: "side_effects", label: "Side effects" },
  { value: "cost_concerns", label: "Cost concerns" },
  { value: "out_of_stock", label: "Medication out of stock" },
  { value: "feeling_better", label: "Feeling better" },
  { value: "schedule_conflict", label: "Schedule conflict" },
  { value: "other", label: "Other" },
]

function MedScheduleItem({
  item,
  price,
  card,
  onSave,
  onRemove,
}: {
  item: CareCompanionHomeData["refillSchedule"]["schedules"][number]
  price: number | undefined
  card: AnnotatedMedicationCard | undefined
  onSave: (id: string, nextDate: string, frequencyDays: number, reason: string) => void
  onRemove: (id: string, reason: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [nextDate, setNextDate] = useState(item.expectedRefillDate)
  const [frequency, setFrequency] = useState(
    item.estimatedDaysSupply ?? 30,
  )
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [removeReason, setRemoveReason] = useState("")
  const [customRemoveReason, setCustomRemoveReason] = useState("")
  const detailPath = card
    ? `/patients/companion/medication-cards/${card.slug}`
    : null

  useEffect(() => {
    setNextDate(item.expectedRefillDate)
    setFrequency(item.estimatedDaysSupply ?? 30)
  }, [item.expectedRefillDate, item.estimatedDaysSupply])

  function handleSave() {
    const finalReason = reason === "other" ? customReason : reason
    if (!finalReason) return
    onSave(item.id, nextDate, frequency, finalReason)
    trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_TAP, {
      medicationName: item.medicationName,
      status: item.status,
      action: "edit_schedule",
      reason: finalReason,
    })
    setEditing(false)
    setReason("")
    setCustomReason("")
  }

  const canSave = reason === "other" ? customReason.trim().length > 0 : reason.length > 0
  const canRemove = removeReason === "other"
    ? customRemoveReason.trim().length > 0
    : removeReason.length > 0

  function handleRemove() {
    const finalReason = removeReason === "other" ? customRemoveReason : removeReason
    if (!finalReason) return
    onRemove(item.id, finalReason)
    setEditing(false)
    setConfirmingRemove(false)
    setRemoveReason("")
    setCustomRemoveReason("")
  }

  const summaryRow = (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium text-foreground">
            {card?.genericName ?? item.medicationName}
          </p>
          {card && (
            <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-foreground">
              {formatCategory(card.category)}
            </span>
          )}
        </div>
        {card && card.brandNames.length > 0 && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {card.brandNames.join(", ")}
          </p>
        )}
        {card && card.strengths.length > 0 && (
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {card.strengths.join(" / ")}
          </p>
        )}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {item.status === "OVERDUE"
            ? `${Math.abs(item.daysUntilRefill)} days overdue`
            : item.status === "DUE"
              ? `Due in ${item.daysUntilRefill} days`
              : `In ${item.daysUntilRefill} days`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={item.status} />
          {price != null && (
            <span className="text-[11px] font-mono text-muted-foreground">
              KES {price.toLocaleString()}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setEditing((v) => !v)
            setConfirmingRemove(false)
            setRemoveReason("")
            setCustomRemoveReason("")
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          {editing ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Pencil className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      {detailPath && !editing ? (
        <Link to={detailPath} className="block no-underline">
          {summaryRow}
        </Link>
      ) : (
        summaryRow
      )}

      {editing && !confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Next refill date
            </label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Refill frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Reason for change
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {reason === "other" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Specify reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canSave
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Check className="h-3.5 w-3.5" />
            Save changes
          </button>
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove from schedule
          </button>
        </div>
      )}

      {editing && confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <p className="text-xs font-medium text-foreground">
            Why are you removing this medication?
          </p>
          <div className="flex flex-col gap-1">
            <select
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {removeReason === "other" && (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={customRemoveReason}
                onChange={(e) => setCustomRemoveReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={!canRemove}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canRemove
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Confirm removal
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingRemove(false)
              setRemoveReason("")
              setCustomRemoveReason("")
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function TestScheduleItem({
  item,
  price,
  card,
  onSave,
  onRemove,
}: {
  item: CareCompanionHomeData["testSchedule"] extends
    | { schedules: (infer I)[] }
    | undefined
    ? I
    : never
  price: number | undefined
  card: AnnotatedMedicationCard | undefined
  onSave: (testName: string, nextDate: string, frequencyMonths: number, reason: string) => void
  onRemove: (testName: string, reason: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [nextDate, setNextDate] = useState(item.expectedDate)
  const [frequency, setFrequency] = useState(item.frequencyMonths)
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [removeReason, setRemoveReason] = useState("")
  const [customRemoveReason, setCustomRemoveReason] = useState("")
  const detailPath = card
    ? `/patients/companion/medication-cards/${card.slug}`
    : null

  useEffect(() => {
    setNextDate(item.expectedDate)
    setFrequency(item.frequencyMonths)
  }, [item.expectedDate, item.frequencyMonths])

  function handleSave() {
    const finalReason = reason === "other" ? customReason : reason
    if (!finalReason) return
    onSave(item.testName, nextDate, frequency, finalReason)
    setEditing(false)
    setReason("")
    setCustomReason("")
  }

  const canSave = reason === "other" ? customReason.trim().length > 0 : reason.length > 0
  const canRemove = removeReason === "other"
    ? customRemoveReason.trim().length > 0
    : removeReason.length > 0

  function handleRemove() {
    const finalReason = removeReason === "other" ? customRemoveReason : removeReason
    if (!finalReason) return
    onRemove(item.testName, finalReason)
    setEditing(false)
    setConfirmingRemove(false)
    setRemoveReason("")
    setCustomRemoveReason("")
  }

  const summaryRow = (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium text-foreground">
            {card?.genericName ?? item.testName}
          </p>
          <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-foreground">
            {card ? formatCategory(card.category) : "Lab Test"}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Every {item.frequencyMonths} month{item.frequencyMonths !== 1 ? "s" : ""}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {item.status === "OVERDUE"
            ? `${Math.abs(item.daysUntilTest)} days overdue`
            : item.status === "DUE"
              ? `Due in ${item.daysUntilTest} days`
              : `In ${item.daysUntilTest} days`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={item.status} />
          {price != null && (
            <span className="text-[11px] font-mono text-muted-foreground">
              KES {price.toLocaleString()}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setEditing((v) => !v)
            setConfirmingRemove(false)
            setRemoveReason("")
            setCustomRemoveReason("")
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          {editing ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Pencil className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      {detailPath && !editing ? (
        <Link to={detailPath} className="block no-underline">
          {summaryRow}
        </Link>
      ) : (
        summaryRow
      )}

      {editing && !confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Next test date
            </label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Test frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {TEST_FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Reason for change
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {reason === "other" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Specify reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canSave
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Check className="h-3.5 w-3.5" />
            Save changes
          </button>
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove from schedule
          </button>
        </div>
      )}

      {editing && confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <p className="text-xs font-medium text-foreground">
            Why are you removing this test?
          </p>
          <div className="flex flex-col gap-1">
            <select
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {removeReason === "other" && (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={customRemoveReason}
                onChange={(e) => setCustomRemoveReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={!canRemove}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canRemove
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Confirm removal
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingRemove(false)
              setRemoveReason("")
              setCustomRemoveReason("")
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function RefillScheduleCard({
  data,
  medicationPrices,
  testPrices,
  medicationCards,
  profile,
  onAddMedication,
}: {
  data: CareCompanionHomeData
  medicationPrices: Record<string, number>
  testPrices: Record<string, number>
  medicationCards: AnnotatedMedicationCard[]
  profile: import("@/types/care-companion").CareCompanionProfile | null
  onAddMedication?: () => void
}) {
  const queryClient = useQueryClient()
  const { schedules, hasMore } = data.refillSchedule
  const { schedules: testSchedules } = data.testSchedule ?? { schedules: [] }
  const allOverdue = [
    ...schedules.filter((s) => s.status === "OVERDUE"),
    ...testSchedules.filter((s) => s.status === "OVERDUE"),
  ]
  const allDue = [
    ...schedules.filter((s) => s.status === "DUE"),
    ...testSchedules.filter((s) => s.status === "DUE"),
  ]
  const overdueCount = allOverdue.length
  const dueCount = allDue.length

  const logEvent = useMutation({
    mutationFn: async (event: Record<string, unknown>) => {
      const { error } = await supabase.from("events").insert({
        id: event.id as string,
        type: event.type as string,
        data: event,
      })
      if (error) throw error
    },
  })

  const patchProfile = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from("profiles").update(patch)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [refillScheduleQueryKey] })
      queryClient.invalidateQueries({ queryKey: [intakeProfileQueryKey] })
      queryClient.invalidateQueries({ queryKey: ["careCompanionHome"] })
    },
  })

  const handleRefillSave = useCallback(
    (id: string, nextDate: string, frequencyDays: number, reason: string) => {
      if (!profile) return
      const item = schedules.find((s) => s.id === id)
      if (!item) return
      const costEntry = profile.costEstimates?.medications?.find(
        (m) => m.name === item.medicationName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason
      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "REFILL_SCHEDULE_CHANGE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item.id,
        medicationName: item.medicationName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item.status,
        daysUntilRefillAtChange: item.daysUntilRefill,
        previousFrequencyDays: item.estimatedDaysSupply ?? 30,
        newFrequencyDays: frequencyDays,
        previousNextDate: item.expectedRefillDate,
        newNextDate: nextDate,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerRefill: costEntry?.estimatedCostPerRefill ?? null,
      })
      const updatedCostEstimates = {
        ...profile.costEstimates,
        medications: (profile.costEstimates?.medications ?? []).map((m) =>
          m.name === item.medicationName
            ? { ...m, refillFrequencyDays: frequencyDays }
            : m,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_TAP, {
        medicationName: item.medicationName,
        action: "save_schedule",
        reason: reasonLabel,
        frequencyDays,
      })
      supabase
        .from("refill_schedules")
        .update({ next_date: nextDate, frequency_days: frequencyDays })
        .eq("id", id)
        .then(() => {
          patchProfile.mutate({ cost_estimates: updatedCostEstimates })
        })
    },
    [profile, schedules, patchProfile, logEvent],
  )

  const handleTestSave = useCallback(
    (testName: string, nextDate: string, frequencyMonths: number, reason: string) => {
      if (!profile) return
      const item = testSchedules.find((t) => t.testName === testName)
      const costEntry = profile.costEstimates?.tests?.find(
        (t) => t.name === testName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason
      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "TEST_SCHEDULE_CHANGE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item?.id ?? `test-${testName}`,
        testName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item?.status ?? "UPCOMING",
        daysUntilTestAtChange: item?.daysUntilTest ?? 0,
        previousFrequencyMonths: item?.frequencyMonths ?? costEntry?.frequencyMonths ?? 12,
        newFrequencyMonths: frequencyMonths,
        previousNextDate: item?.expectedDate ?? "",
        newNextDate: nextDate,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerTest: costEntry?.estimatedCostPerTest ?? null,
      })
      const updatedCostEstimates = {
        ...profile.costEstimates,
        tests: (profile.costEstimates?.tests ?? []).map((t) =>
          t.name === testName
            ? { ...t, frequencyMonths }
            : t,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_TAP, {
        testName,
        action: "save_test_schedule",
        reason: reasonLabel,
        frequencyMonths,
      })
      supabase
        .from("refill_schedules")
        .update({
          next_date: nextDate,
          frequency_days: frequencyMonths * 30,
        })
        .eq("medication_name", testName)
        .then(() => {
          patchProfile.mutate({ cost_estimates: updatedCostEstimates })
        })
    },
    [profile, testSchedules, patchProfile, logEvent],
  )

  const handleRefillRemove = useCallback(
    (id: string, reason: string) => {
      if (!profile) return
      const item = schedules.find((s) => s.id === id)
      if (!item) return

      const costEntry = profile.costEstimates?.medications?.find(
        (m) => m.name === item.medicationName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason

      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "REFILL_SCHEDULE_REMOVE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item.id,
        medicationName: item.medicationName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item.status,
        daysUntilRefillAtChange: item.daysUntilRefill,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerRefill: costEntry?.estimatedCostPerRefill ?? null,
      })

      const updatedCostEstimates = {
        ...profile.costEstimates,
        medications: (profile.costEstimates?.medications ?? []).filter(
          (m) => m.name !== item.medicationName,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_REMOVE, {
        medicationName: item.medicationName,
        status: item.status,
        reason: reasonLabel,
      })
      supabase
        .from("refill_schedules")
        .update({ status: "CANCELLED" })
        .eq("id", id)
        .then(() => {
          patchProfile.mutate({ cost_estimates: updatedCostEstimates })
        })
    },
    [profile, schedules, patchProfile, logEvent],
  )

  const handleTestRemove = useCallback(
    (testName: string, reason: string) => {
      if (!profile) return

      const item = testSchedules.find((t) => t.testName === testName)
      const costEntry = profile.costEstimates?.tests?.find(
        (t) => t.name === testName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason

      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "TEST_SCHEDULE_REMOVE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item?.id ?? `test-${testName}`,
        testName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item?.status ?? "UPCOMING",
        daysUntilTestAtChange: item?.daysUntilTest ?? 0,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerTest: costEntry?.estimatedCostPerTest ?? null,
      })

      const updatedCostEstimates = {
        ...profile.costEstimates,
        tests: (profile.costEstimates?.tests ?? []).filter(
          (t) => t.name !== testName,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.TEST_REMOVE, {
        testName,
        status: item?.status ?? "UPCOMING",
        reason: reasonLabel,
      })
      supabase
        .from("refill_schedules")
        .update({ status: "CANCELLED" })
        .eq("medication_name", testName)
        .then(() => {
          patchProfile.mutate({ cost_estimates: updatedCostEstimates })
        })
    },
    [profile, testSchedules, patchProfile, logEvent],
  )

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-left">
      <Link
        to="/patients/companion/refill-schedule"
        className="flex items-start justify-between no-underline transition-colors active:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              overdueCount > 0
                ? "bg-red-100 text-red-600"
                : "bg-primary/10 text-primary"
            )}
          >
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Medication & Test Schedule
            </h3>
            {overdueCount > 0 ? (
              <p className="text-xs font-medium text-red-600">
                {overdueCount} overdue
                {dueCount > 0 ? `, ${dueCount} due soon` : ""}
              </p>
            ) : dueCount > 0 ? (
              <p className="text-xs text-amber-600">
                {dueCount} due soon
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                All on track
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>

      {(schedules.length > 0 || testSchedules.length > 0) && (
        <div className="mt-3 space-y-2">
          {schedules.map((s) => (
            <MedScheduleItem
              key={s.id}
              item={s}
              price={medicationPrices[s.medicationName.toLowerCase()]}
              card={findMatchingCard(s.medicationName, medicationCards)}
              onSave={handleRefillSave}
              onRemove={handleRefillRemove}
            />
          ))}
          {testSchedules.map((t) => (
            <TestScheduleItem
              key={t.id}
              item={t}
              price={testPrices[t.testName.toLowerCase()]}
              card={findMatchingCard(t.testName, medicationCards)}
              onSave={handleTestSave}
              onRemove={handleTestRemove}
            />
          ))}
          {hasMore && (
            <Link
              to="/patients/companion/refill-schedule"
              className="block text-center text-[11px] text-muted-foreground no-underline hover:text-primary"
            >
              View all schedules
            </Link>
          )}
          {onAddMedication && (
            <button
              type="button"
              onClick={onAddMedication}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Add medication or test</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    OVERDUE: {
      label: "Overdue",
      className: "bg-red-100 text-red-700",
    },
    DUE: {
      label: "Due soon",
      className: "bg-amber-100 text-amber-700",
    },
    UPCOMING: {
      label: "Upcoming",
      className: "bg-muted text-muted-foreground",
    },
  }
  const c = config[status] ?? config.UPCOMING
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
        c.className
      )}
    >
      {c.label}
    </span>
  )
}

function CostTrackerCard({ data }: { data: CareCompanionHomeData }) {
  const navigate = useNavigate()
  const { costSummary } = data

  const formatKES = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return "KES 0"
    return `KES ${num.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/patients/companion/cost-tracker")}
      className="w-full rounded-xl border bg-card p-4 text-left transition-colors active:bg-muted/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Cost Tracker
            </h3>
            <p className="text-xs text-muted-foreground">
              {costSummary.year} spending overview
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Year to date</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            {formatKES(costSummary.ytdSpend)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Projected annual</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            {formatKES(costSummary.annualProjection)}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-[11px] text-emerald-600">Cashback earned</p>
          <p className="text-sm font-semibold font-mono text-emerald-700">
            {formatKES(costSummary.cashbackEarned)}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-[11px] text-emerald-600">Cashback opportunity</p>
          <p className="text-sm font-semibold font-mono text-emerald-700">
            {formatKES(
              String(
                Math.round(parseFloat(costSummary.annualProjection) * 0.05),
              ),
            )}
          </p>
        </div>
      </div>
    </button>
  )
}

function EmergencyCardCard({ data }: { data: CareCompanionHomeData }) {
  const navigate = useNavigate()
  const { emergencyCard, emergencyTransportCredit } = data

  if (!emergencyCard) return null

  return (
    <button
      type="button"
      onClick={() => navigate("/patients/companion/emergency-card")}
      className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-left transition-colors active:bg-red-100/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-900">
              {emergencyCard.title}
            </h3>
            <p className="text-xs text-red-700/70">
              Warning signs, first aid steps, when to go to ER
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-red-400" />
      </div>

      {emergencyTransportCredit && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2">
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <p className="text-xs text-red-800">
            KES{" "}
            <span className="font-mono font-medium">
              {parseFloat(
                emergencyTransportCredit.preApprovedAmount
              ).toLocaleString("en-KE")}
            </span>{" "}
            emergency transport credit available
          </p>
        </div>
      )}
    </button>
  )
}

const QUICK_ACTIONS = [
  {
    label: "Care History",
    icon: Clock,
    path: "/patients/companion/medication-timeline",
    color: "bg-sky-100 text-sky-600",
  },
  {
    label: "Health Education",
    icon: BookOpen,
    path: "/patients/companion/education",
    color: "bg-emerald-100 text-emerald-600",
  },
]

function QuickActions() {
  const navigate = useNavigate()

  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Quick Actions
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.path}
            type="button"
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 transition-colors active:bg-muted/50"
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                action.color
              )}
            >
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-center text-[11px] font-medium leading-tight text-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function AiAssistantFab() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate("/patients/companion/assistant")}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  )
}

function EducationCard({ data }: { data: CareCompanionHomeData }) {
  const navigate = useNavigate()
  const { educationFeed } = data

  if (!educationFeed) {
    return (
      <button
        type="button"
        onClick={() => navigate("/patients/companion/education")}
        className="w-full rounded-xl border bg-card p-4 text-left transition-colors active:bg-muted/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Education
              </h3>
              <p className="text-xs text-muted-foreground">
                Browse all articles
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </button>
    )
  }

  const contentTypeLabel: Record<string, string> = {
    DIETARY: "Nutrition",
    EXERCISE: "Exercise",
    MYTH_BUSTING: "Myth Busting",
    EMOTIONAL: "Wellbeing",
    ACCEPTANCE: "Living Well",
    SELF_MONITORING: "Self Care",
    MILESTONE: "Milestone",
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/patients/companion/education/${educationFeed.slug}`)}
      className="w-full rounded-xl border bg-card p-4 text-left transition-colors active:bg-muted/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                This Week's Read
              </h3>
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                {contentTypeLabel[educationFeed.contentType] ?? "Health"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {educationFeed.title}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
    </button>
  )
}
