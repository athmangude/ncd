import { useState } from "react"
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
  MapPin,
  CreditCard,
  Bell,
  Sparkles,
  UserCog,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionErrorBoundary } from "./components/SectionErrorBoundary"
import { EmergencyCardStaticFallback } from "./components/EmergencyCardStaticFallback"
import { MedicationCardDrawer } from "./components/MedicationCardDrawer"
import { useCareCompanionHome } from "./hooks/useCareCompanionHome"
import type { CareCompanionHome as CareCompanionHomeData } from "@/types/care-companion"

export default function CareCompanionHome() {
  const { data, isLoading, error } = useCareCompanionHome()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMedicationId, setDrawerMedicationId] = useState<
    string | undefined
  >(undefined)

  const openMedicationDrawer = (medicationId?: string) => {
    setDrawerMedicationId(medicationId)
    setDrawerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <SectionErrorBoundary sectionName="Refill Schedule">
        <RefillScheduleCard
          data={data}
          onMedicationQuickView={openMedicationDrawer}
        />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Cost Tracker">
        <CostTrackerCard data={data} />
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionName="Emergency Card"
        fallbackContent={<EmergencyCardStaticFallback />}
      >
        <EmergencyCardCard data={data} />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Education">
        <EducationCard data={data} />
      </SectionErrorBoundary>

      <QuickActions />

      <AiAssistantFab />

      <MedicationCardDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialMedicationId={drawerMedicationId}
      />
    </div>
  )
}

function RefillScheduleCard({
  data,
  onMedicationQuickView,
}: {
  data: CareCompanionHomeData
  onMedicationQuickView?: (medicationId?: string) => void
}) {
  const navigate = useNavigate()
  const { schedules, hasMore } = data.refillSchedule
  const overdueCount = schedules.filter((s) => s.status === "OVERDUE").length
  const dueCount = schedules.filter((s) => s.status === "DUE").length

  return (
    <button
      type="button"
      onClick={() => navigate("/patients/care-companion/refill-schedule")}
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
              Refill Schedule
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
                All refills on track
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>

      {schedules.length > 0 && (
        <div className="mt-3 space-y-2">
          {schedules.map((s) => (
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
              <div className="flex items-center gap-1.5">
                {onMedicationQuickView && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onMedicationQuickView()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation()
                        e.preventDefault()
                        onMedicationQuickView()
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </span>
                )}
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
          {hasMore && (
            <p className="text-center text-[11px] text-muted-foreground">
              View all refills
            </p>
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
      onClick={() => navigate("/patients/care-companion/cost-tracker")}
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
      onClick={() => navigate("/patients/care-companion/emergency-card")}
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
    path: "/patients/care-companion/medication-cards",
    color: "bg-violet-100 text-violet-600",
  },
  {
    label: "Purchase History",
    icon: Clock,
    path: "/patients/care-companion/medication-timeline",
    color: "bg-sky-100 text-sky-600",
  },
  {
    label: "Find Pharmacy",
    icon: MapPin,
    path: "/patients/care-companion/pharmacy-stock",
    color: "bg-teal-100 text-teal-600",
  },
  {
    label: "Medication Loan",
    icon: CreditCard,
    path: "/patients/care-companion/medication-loan",
    color: "bg-amber-100 text-amber-600",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/patients/care-companion/notifications",
    color: "bg-rose-100 text-rose-600",
  },
  {
    label: "Update Profile",
    icon: UserCog,
    path: "/patients/care-companion/intake",
    color: "bg-slate-100 text-slate-600",
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
      onClick={() => navigate("/patients/care-companion/assistant")}
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
        onClick={() => navigate("/patients/care-companion/education")}
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
      onClick={() => navigate("/patients/care-companion/education")}
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
