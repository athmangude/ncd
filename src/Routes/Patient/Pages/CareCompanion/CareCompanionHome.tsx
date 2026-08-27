import { lazy, Suspense, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  ChevronRight,
  TrendingUp,
  Shield,
  BookOpen,
  AlertTriangle,
  Loader2,
  Pill,
  Clock,
  CreditCard,
  Sparkles,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getMedicationPriceKES } from "@/mocks/fixtures/medication-prices"
import { SectionErrorBoundary } from "./components/SectionErrorBoundary"
import { EmergencyCardStaticFallback } from "./components/EmergencyCardStaticFallback"
import { MedicationCardDrawer } from "./components/MedicationCardDrawer"
import { AddMedicationDrawer } from "./components/AddMedicationDrawer"
import { useCareCompanionHome } from "./hooks/useCareCompanionHome"
import { useIntakeProfile } from "./hooks/useIntakeProfile"
import { useAiPipeline } from "./hooks/useAiPipeline"
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
  const { isRunning: aiRunning } = useAiPipeline(profile ?? null)
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const unreadInsights = notifications.filter(
    (n) => n.type === "AI_INSIGHT" && !n.readAt,
  )

  if (profileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
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
      medPriceMap[key] = getMedicationPriceKES(s.medicationName)
    }
  }
  const testPriceMap: Record<string, number> = {}
  for (const t of profile?.costEstimates?.tests ?? []) {
    testPriceMap[t.name.toLowerCase()] = t.estimatedCostPerTest
  }
  for (const t of data.testSchedule?.schedules ?? []) {
    const key = t.testName.toLowerCase()
    if (testPriceMap[key] == null) {
      testPriceMap[key] = getMedicationPriceKES(t.testName)
    }
  }

  const sections: Record<string, React.ReactNode> = {
    refill: (
      <SectionErrorBoundary key="refill" sectionName="Refill Schedule">
        <RefillScheduleCard
          data={data}
          medicationPrices={medPriceMap}
          testPrices={testPriceMap}
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

      {(unreadInsights.length > 0 || aiRunning) && (
        <button
          type="button"
          onClick={() => navigate("/patients/notifications")}
          className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-left transition-colors active:bg-primary/10"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            {aiRunning ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {aiRunning
                ? "Analyzing your health data..."
                : `${unreadInsights.length} new insight${unreadInsights.length === 1 ? "" : "s"}`}
            </p>
            {!aiRunning && (
              <p className="text-xs text-muted-foreground">
                Tap to view in notifications
              </p>
            )}
          </div>
          {!aiRunning && (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
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

function RefillScheduleCard({
  data,
  medicationPrices,
  testPrices,
  onAddMedication,
}: {
  data: CareCompanionHomeData
  medicationPrices: Record<string, number>
  testPrices: Record<string, number>
  onAddMedication?: () => void
}) {
  const navigate = useNavigate()
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

  return (
    <button
      type="button"
      onClick={() => navigate("/patients/companion/refill-schedule")}
      className="w-full rounded-xl border bg-card p-4 text-left transition-colors active:bg-muted/50"
    >
      <div className="flex items-start justify-between">
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
      </div>

      {(schedules.length > 0 || testSchedules.length > 0) && (
        <div className="mt-3 space-y-2">
          {schedules.map((s) => {
            const price = medicationPrices[s.medicationName.toLowerCase()]
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {s.medicationName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.status === "OVERDUE"
                      ? `${Math.abs(s.daysUntilRefill)} days overdue`
                      : s.status === "DUE"
                        ? `Due in ${s.daysUntilRefill} days`
                        : `In ${s.daysUntilRefill} days`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={s.status} />
                    {price != null && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        KES {price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </div>
            )
          })}
          {testSchedules.map((t) => {
            const price = testPrices[t.testName.toLowerCase()]
            return (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {t.testName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.status === "OVERDUE"
                      ? `${Math.abs(t.daysUntilTest)} days overdue`
                      : t.status === "DUE"
                        ? `Due in ${t.daysUntilTest} days`
                        : `In ${t.daysUntilTest} days`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={t.status} />
                    {price != null && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        KES {price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </div>
            )
          })}
          {hasMore && (
            <p className="text-center text-[11px] text-muted-foreground">
              View all schedules
            </p>
          )}
          {onAddMedication && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onAddMedication()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  e.preventDefault()
                  onAddMedication()
                }
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Add medication or test</span>
            </span>
          )}
        </div>
      )}
    </button>
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
          <p className="text-[11px] text-muted-foreground">Monthly avg</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            {formatKES(costSummary.monthlyAverage)}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-[11px] text-emerald-600">Cashback earned</p>
          <p className="text-sm font-semibold font-mono text-emerald-700">
            {formatKES(costSummary.cashbackEarned)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Projected annual</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            {formatKES(costSummary.annualProjection)}
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
    label: "My Medications",
    icon: Pill,
    path: "/patients/companion/medication-cards",
    color: "bg-violet-100 text-violet-600",
  },
  {
    label: "Purchase History",
    icon: Clock,
    path: "/patients/companion/medication-timeline",
    color: "bg-sky-100 text-sky-600",
  },
  {
    label: "Medication Loan",
    icon: CreditCard,
    path: "/patients/companion/medication-loan",
    color: "bg-amber-100 text-amber-600",
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
      onClick={() => navigate("/patients/companion/education")}
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
