import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Check,
  Clock,
  Sparkles,
  Apple,
  Dumbbell,
  ShieldQuestion,
  Heart,
  HandHeart,
  Activity,
  Trophy,
  PlayCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { useEducationFeed } from "./hooks/useEducationFeed"
import { useIntakeProfile } from "./hooks/useIntakeProfile"
import { useLessonProgress } from "./hooks/useLessonProgress"
import type { EducationFeedCard } from "./hooks/useEducationFeed"
import type { EducationContentType, ConditionType } from "@/types/care-companion"
import type { LessonProgress } from "@/mocks/domain/careCompanion"

const CONDITION_LABELS: Record<string, string> = {
  DIABETES: "Diabetes",
  HYPERTENSION: "Hypertension",
  ASTHMA: "Asthma",
  CANCER: "Cancer",
  KIDNEY_DISEASE: "Kidney Disease",
  HEART_DISEASE: "Heart Disease",
  SICKLE_CELL: "Sickle Cell",
  HIV_AIDS: "HIV/AIDS",
  EPILEPSY: "Epilepsy",
  COPD: "COPD",
  ARTHRITIS: "Arthritis",
  MENTAL_HEALTH: "Mental Health",
  THYROID: "Thyroid",
  STROKE: "Stroke",
  LIVER_DISEASE: "Liver Disease",
  GENERAL: "General",
}

const CONTENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof BookOpen; color: string; bgColor: string }
> = {
  DIETARY: {
    label: "Nutrition",
    icon: Apple,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  EXERCISE: {
    label: "Movement",
    icon: Dumbbell,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  MYTH_BUSTING: {
    label: "Myth Busting",
    icon: ShieldQuestion,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  EMOTIONAL: {
    label: "Emotional",
    icon: Heart,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  ACCEPTANCE: {
    label: "Acceptance",
    icon: HandHeart,
    color: "text-teal-700",
    bgColor: "bg-teal-100",
  },
  SELF_MONITORING: {
    label: "Monitoring",
    icon: Activity,
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
  MILESTONE: {
    label: "Milestones",
    icon: Trophy,
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
}

const IMAGE_THEMES: Record<
  string,
  { gradient: string; pattern: string }
> = {
  "fresh-vegetables": {
    gradient: "from-green-400/90 to-emerald-600/90",
    pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "healthy-cooking": {
    gradient: "from-orange-400/90 to-amber-600/90",
    pattern: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "market-shopping": {
    gradient: "from-yellow-400/90 to-orange-500/90",
    pattern: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 40%)",
  },
  "balanced-plate": {
    gradient: "from-lime-400/90 to-green-600/90",
    pattern: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "fruit-selection": {
    gradient: "from-pink-400/90 to-rose-500/90",
    pattern: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.12) 0%, transparent 45%)",
  },
  "morning-walk": {
    gradient: "from-sky-400/90 to-blue-500/90",
    pattern: "radial-gradient(circle at 80% 60%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "stretching": {
    gradient: "from-violet-400/90 to-purple-600/90",
    pattern: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "light-exercise": {
    gradient: "from-cyan-400/90 to-teal-500/90",
    pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)",
  },
  "yoga-pose": {
    gradient: "from-indigo-400/90 to-violet-600/90",
    pattern: "radial-gradient(circle at 70% 80%, rgba(255,255,255,0.12) 0%, transparent 45%)",
  },
  "outdoor-activity": {
    gradient: "from-teal-400/90 to-cyan-600/90",
    pattern: "radial-gradient(circle at 40% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "fact-check": {
    gradient: "from-amber-400/90 to-yellow-600/90",
    pattern: "radial-gradient(circle at 30% 60%, rgba(255,255,255,0.12) 0%, transparent 50%)",
  },
  "medical-truth": {
    gradient: "from-blue-400/90 to-indigo-600/90",
    pattern: "radial-gradient(circle at 80% 40%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "doctor-consultation": {
    gradient: "from-emerald-400/90 to-teal-600/90",
    pattern: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0%, transparent 45%)",
  },
  "health-facts": {
    gradient: "from-sky-400/90 to-blue-600/90",
    pattern: "radial-gradient(circle at 60% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "family-support": {
    gradient: "from-rose-400/90 to-pink-600/90",
    pattern: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "peaceful-moment": {
    gradient: "from-purple-400/90 to-indigo-500/90",
    pattern: "radial-gradient(circle at 40% 70%, rgba(255,255,255,0.12) 0%, transparent 50%)",
  },
  "community-care": {
    gradient: "from-orange-400/90 to-rose-500/90",
    pattern: "radial-gradient(circle at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "meditation": {
    gradient: "from-slate-400/90 to-zinc-600/90",
    pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)",
  },
  "new-beginning": {
    gradient: "from-amber-300/90 to-orange-500/90",
    pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0%, transparent 50%)",
  },
  "self-care": {
    gradient: "from-pink-300/90 to-rose-500/90",
    pattern: "radial-gradient(circle at 30% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "journaling": {
    gradient: "from-stone-400/90 to-amber-600/90",
    pattern: "radial-gradient(circle at 60% 30%, rgba(255,255,255,0.12) 0%, transparent 45%)",
  },
  "sunrise": {
    gradient: "from-yellow-300/90 to-rose-400/90",
    pattern: "radial-gradient(circle at 50% 90%, rgba(255,255,255,0.2) 0%, transparent 60%)",
  },
  "blood-pressure-check": {
    gradient: "from-red-400/90 to-rose-600/90",
    pattern: "radial-gradient(circle at 70% 40%, rgba(255,255,255,0.12) 0%, transparent 50%)",
  },
  "glucose-monitor": {
    gradient: "from-blue-400/90 to-sky-600/90",
    pattern: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "health-diary": {
    gradient: "from-emerald-400/90 to-green-600/90",
    pattern: "radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12) 0%, transparent 45%)",
  },
  "medication-tracking": {
    gradient: "from-indigo-400/90 to-blue-600/90",
    pattern: "radial-gradient(circle at 20% 40%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "celebration": {
    gradient: "from-yellow-400/90 to-amber-500/90",
    pattern: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)",
  },
  "achievement": {
    gradient: "from-emerald-400/90 to-teal-500/90",
    pattern: "radial-gradient(circle at 40% 60%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
  "progress-chart": {
    gradient: "from-blue-400/90 to-indigo-500/90",
    pattern: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.12) 0%, transparent 50%)",
  },
  "wellness-journey": {
    gradient: "from-teal-400/90 to-emerald-600/90",
    pattern: "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)",
  },
}

const FALLBACK_GRADIENTS: Record<string, string> = {
  DIETARY: "from-green-400/80 to-emerald-600/80",
  EXERCISE: "from-blue-400/80 to-sky-600/80",
  MYTH_BUSTING: "from-amber-400/80 to-yellow-600/80",
  EMOTIONAL: "from-purple-400/80 to-violet-600/80",
  ACCEPTANCE: "from-teal-400/80 to-cyan-600/80",
  SELF_MONITORING: "from-indigo-400/80 to-blue-600/80",
  MILESTONE: "from-yellow-400/80 to-amber-500/80",
}

const CONDITION_COLORS: Record<string, string> = {
  DIABETES: "bg-orange-100 text-orange-800",
  HYPERTENSION: "bg-red-100 text-red-800",
  ASTHMA: "bg-sky-100 text-sky-800",
  CANCER: "bg-violet-100 text-violet-800",
  KIDNEY_DISEASE: "bg-amber-100 text-amber-800",
  HEART_DISEASE: "bg-rose-100 text-rose-800",
  SICKLE_CELL: "bg-pink-100 text-pink-800",
  HIV_AIDS: "bg-fuchsia-100 text-fuchsia-800",
  EPILEPSY: "bg-cyan-100 text-cyan-800",
  COPD: "bg-slate-100 text-slate-800",
  ARTHRITIS: "bg-lime-100 text-lime-800",
  MENTAL_HEALTH: "bg-purple-100 text-purple-800",
  THYROID: "bg-emerald-100 text-emerald-800",
  STROKE: "bg-red-100 text-red-800",
  LIVER_DISEASE: "bg-yellow-100 text-yellow-800",
  GENERAL: "bg-muted text-muted-foreground",
}

function estimateReadTime(body: string): number {
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200))
}

export default function EducationFeedPage() {
  const { data, isLoading, error } = useEducationFeed()
  const { data: profile } = useIntakeProfile()
  const { data: progressMap } = useLessonProgress()
  const [selectedCondition, setSelectedCondition] = useState<
    ConditionType | "ALL" | "FOR_YOU"
  >("FOR_YOU")
  const [selectedType, setSelectedType] = useState<
    EducationContentType | "ALL"
  >("ALL")

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.EDUCATION.VIEW)
  }, [])

  const userConditions = useMemo(
    () => profile?.conditions?.type ?? [],
    [profile],
  )

  const allConditions = useMemo(() => {
    if (!data?.cards) return []
    const set = new Set<string>()
    data.cards.forEach((c) => set.add(c.conditionType))
    return Array.from(set).sort()
  }, [data])

  const allTypes = useMemo(() => {
    if (!data?.cards) return []
    const set = new Set<string>()
    data.cards.forEach((c) => set.add(c.contentType))
    return Array.from(set)
  }, [data])

  const filteredCards = useMemo(() => {
    if (!data?.cards) return []
    let cards = data.cards

    if (selectedCondition === "FOR_YOU" && userConditions.length > 0) {
      const condSet = new Set(userConditions as string[])
      condSet.add("GENERAL")
      cards = cards.filter((c) => condSet.has(c.conditionType))
    } else if (selectedCondition !== "ALL" && selectedCondition !== "FOR_YOU") {
      cards = cards.filter((c) => c.conditionType === selectedCondition)
    }

    if (selectedType !== "ALL") {
      cards = cards.filter((c) => c.contentType === selectedType)
    }

    return cards
  }, [data, selectedCondition, selectedType, userConditions])

  const unreadCards = useMemo(
    () => filteredCards.filter((c) => !c.viewed),
    [filteredCards],
  )

  const readCards = useMemo(
    () => filteredCards.filter((c) => c.viewed),
    [filteredCards],
  )

  const featuredCard = unreadCards[0] ?? filteredCards[0] ?? null

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
          Could not load health articles.
        </p>
      </div>
    )
  }

  const totalCards = data.cards.length
  const totalRead = data.cards.filter((c) => c.viewed).length

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      {/* Header with progress */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Health Library
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {totalCards} articles &middot; {totalRead} read
        </p>
        {totalCards > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.round((totalRead / totalCards) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Condition filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {userConditions.length > 0 && (
          <FilterChip
            label="For You"
            icon={<Sparkles className="h-3 w-3" />}
            active={selectedCondition === "FOR_YOU"}
            onClick={() => setSelectedCondition("FOR_YOU")}
          />
        )}
        <FilterChip
          label="All Topics"
          active={selectedCondition === "ALL"}
          onClick={() => setSelectedCondition("ALL")}
        />
        {allConditions
          .filter((c) => c !== "GENERAL")
          .map((cond) => (
            <FilterChip
              key={cond}
              label={CONDITION_LABELS[cond] ?? cond}
              active={selectedCondition === cond}
              onClick={() =>
                setSelectedCondition(cond as ConditionType)
              }
            />
          ))}
      </div>

      {/* Content type filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        <TypeChip label="All" value="ALL" active={selectedType === "ALL"} onClick={() => setSelectedType("ALL")} />
        {allTypes.map((t) => {
          const config = CONTENT_TYPE_CONFIG[t]
          if (!config) return null
          return (
            <TypeChip
              key={t}
              label={config.label}
              value={t}
              icon={config.icon}
              active={selectedType === t}
              onClick={() => setSelectedType(t as EducationContentType)}
            />
          )
        })}
      </div>

      {/* Featured card */}
      {featuredCard && (
        <FeaturedCard card={featuredCard} progress={progressMap?.[featuredCard.id]} />
      )}

      {/* Unread articles */}
      {unreadCards.length > 0 && (
        <div>
          <SectionLabel count={unreadCards.length} label="New for you" />
          <div className="flex flex-col gap-3 mt-2">
            {unreadCards.map((card) =>
              card.id === featuredCard?.id ? null : (
                <ArticleCard key={card.id} card={card} progress={progressMap?.[card.id]} />
              ),
            )}
          </div>
        </div>
      )}

      {/* Read articles */}
      {readCards.length > 0 && (
        <div>
          <SectionLabel count={readCards.length} label="Completed" />
          <div className="flex flex-col gap-3 mt-2">
            {readCards.map((card) => (
              <ArticleCard key={card.id} card={card} progress={progressMap?.[card.id]} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredCards.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              No articles match your filters
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try selecting a different topic or category.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center gap-1",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground active:bg-muted/80",
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function TypeChip({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  value: string
  icon?: typeof BookOpen
  active: boolean
  onClick: () => void
}) {
  const config = CONTENT_TYPE_CONFIG[value]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors inline-flex items-center gap-1.5",
        active
          ? config
            ? `${config.bgColor} ${config.color} ring-1 ring-current/20`
            : "bg-primary text-primary-foreground"
          : "bg-card border border-border text-muted-foreground",
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  )
}

function SectionLabel({
  count,
  label,
}: {
  count: number
  label: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      <span className="text-xs text-muted-foreground">{count} articles</span>
    </div>
  )
}

function CardImageHeader({
  imageUrl,
  contentType,
  icon: Icon,
  tall,
}: {
  imageUrl: string | null
  contentType: string
  icon: typeof BookOpen
  tall?: boolean
}) {
  const theme = imageUrl ? IMAGE_THEMES[imageUrl] : null
  const gradient =
    theme?.gradient ?? FALLBACK_GRADIENTS[contentType] ?? "from-muted to-muted"
  const pattern =
    theme?.pattern ??
    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)"

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br",
        gradient,
        tall ? "h-36 rounded-t-2xl" : "h-24 rounded-t-xl",
      )}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: pattern }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className={cn(
            "text-white/25",
            tall ? "h-16 w-16" : "h-10 w-10",
          )}
        />
      </div>
    </div>
  )
}

function FeaturedCard({
  card,
  progress,
}: {
  card: EducationFeedCard
  progress?: LessonProgress
}) {
  const typeConfig = CONTENT_TYPE_CONFIG[card.contentType]
  const TypeIcon = typeConfig?.icon ?? BookOpen
  const totalSections = card.sections?.length ?? 0
  const hasProgress = progress && !progress.completed && progress.currentSection > 0
  const estMinutes = card.estimatedMinutes ?? estimateReadTime(card.body)

  return (
    <Link
      to={`/patients/companion/education/${card.slug}`}
      className="relative block w-full rounded-2xl border border-primary/20 overflow-hidden"
    >
      <CardImageHeader
        imageUrl={card.imageUrl}
        contentType={card.contentType}
        icon={TypeIcon}
        tall
      />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              typeConfig?.bgColor ?? "bg-muted",
              typeConfig?.color ?? "text-muted-foreground",
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {typeConfig?.label ?? card.contentType}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              CONDITION_COLORS[card.conditionType] ?? "bg-muted text-muted-foreground",
            )}
          >
            {CONDITION_LABELS[card.conditionType] ?? card.conditionType}
          </span>
        </div>

        <h3 className="text-base font-semibold text-foreground leading-snug">
          {card.title}
        </h3>

        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {card.body}
        </p>

        {totalSections > 0 && hasProgress && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">
                {progress.currentSection}/{totalSections} sections
              </span>
              <span className="text-[10px] font-medium text-primary">
                {Math.round((progress.currentSection / totalSections) * 100)}%
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(progress.currentSection / totalSections) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {estMinutes} min
            </span>
            {totalSections > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {totalSections} sections
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            {hasProgress ? (
              <>
                <PlayCircle className="h-3 w-3" />
                Continue
              </>
            ) : (
              <>
                Start lesson
                <ChevronRight className="h-3 w-3" />
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

function ArticleCard({
  card,
  progress,
}: {
  card: EducationFeedCard
  progress?: LessonProgress
}) {
  const typeConfig = CONTENT_TYPE_CONFIG[card.contentType]
  const TypeIcon = typeConfig?.icon ?? BookOpen
  const totalSections = card.sections?.length ?? 0
  const hasProgress = progress && !progress.completed && progress.currentSection > 0
  const isCompleted = progress?.completed ?? card.viewed
  const estMinutes = card.estimatedMinutes ?? estimateReadTime(card.body)

  return (
    <Link
      to={`/patients/companion/education/${card.slug}`}
      className="flex items-start gap-3 rounded-xl border bg-card p-3.5 transition-all active:bg-muted/50"
    >
      <div className="relative">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            typeConfig?.bgColor ?? "bg-muted",
          )}
        >
          <TypeIcon
            className={cn(
              "h-5 w-5",
              typeConfig?.color ?? "text-muted-foreground",
            )}
          />
        </div>
        {hasProgress && totalSections > 0 && (
          <svg
            className="absolute -inset-0.5"
            viewBox="0 0 44 44"
          >
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/50"
            />
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${(progress.currentSection / totalSections) * 125.6} 125.6`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              className="text-primary"
            />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "text-sm font-medium leading-snug",
              isCompleted ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {card.title}
          </h3>
          {isCompleted ? (
            <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          ) : hasProgress ? (
            <PlayCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              CONDITION_COLORS[card.conditionType] ??
                "bg-muted text-muted-foreground",
            )}
          >
            {CONDITION_LABELS[card.conditionType] ?? card.conditionType}
          </span>
          {totalSections > 0 ? (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <BookOpen className="h-2.5 w-2.5" />
              {hasProgress
                ? `${progress.currentSection}/${totalSections}`
                : `${totalSections} sections`}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {estMinutes} min
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
