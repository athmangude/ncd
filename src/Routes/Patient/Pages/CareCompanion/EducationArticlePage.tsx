import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Apple,
  Dumbbell,
  ShieldQuestion,
  Heart,
  HandHeart,
  Activity,
  Trophy,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { useEducationFeed } from "./hooks/useEducationFeed"
import { useLessonProgress } from "./hooks/useLessonProgress"
import type { EducationFeedCard } from "./hooks/useEducationFeed"
import type { EducationSection } from "@/types/care-companion"

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

const IMAGE_THEMES: Record<string, { gradient: string; pattern: string }> = {
  "fresh-vegetables": { gradient: "from-green-400/90 to-emerald-600/90", pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "healthy-cooking": { gradient: "from-orange-400/90 to-amber-600/90", pattern: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "market-shopping": { gradient: "from-yellow-400/90 to-orange-500/90", pattern: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 40%)" },
  "balanced-plate": { gradient: "from-lime-400/90 to-green-600/90", pattern: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "fruit-selection": { gradient: "from-pink-400/90 to-rose-500/90", pattern: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.12) 0%, transparent 45%)" },
  "morning-walk": { gradient: "from-sky-400/90 to-blue-500/90", pattern: "radial-gradient(circle at 80% 60%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "stretching": { gradient: "from-violet-400/90 to-purple-600/90", pattern: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "light-exercise": { gradient: "from-cyan-400/90 to-teal-500/90", pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)" },
  "yoga-pose": { gradient: "from-indigo-400/90 to-violet-600/90", pattern: "radial-gradient(circle at 70% 80%, rgba(255,255,255,0.12) 0%, transparent 45%)" },
  "outdoor-activity": { gradient: "from-teal-400/90 to-cyan-600/90", pattern: "radial-gradient(circle at 40% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "fact-check": { gradient: "from-amber-400/90 to-yellow-600/90", pattern: "radial-gradient(circle at 30% 60%, rgba(255,255,255,0.12) 0%, transparent 50%)" },
  "medical-truth": { gradient: "from-blue-400/90 to-indigo-600/90", pattern: "radial-gradient(circle at 80% 40%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "doctor-consultation": { gradient: "from-emerald-400/90 to-teal-600/90", pattern: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0%, transparent 45%)" },
  "health-facts": { gradient: "from-sky-400/90 to-blue-600/90", pattern: "radial-gradient(circle at 60% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "family-support": { gradient: "from-rose-400/90 to-pink-600/90", pattern: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "peaceful-moment": { gradient: "from-purple-400/90 to-indigo-500/90", pattern: "radial-gradient(circle at 40% 70%, rgba(255,255,255,0.12) 0%, transparent 50%)" },
  "community-care": { gradient: "from-orange-400/90 to-rose-500/90", pattern: "radial-gradient(circle at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "meditation": { gradient: "from-slate-400/90 to-zinc-600/90", pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)" },
  "new-beginning": { gradient: "from-amber-300/90 to-orange-500/90", pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0%, transparent 50%)" },
  "self-care": { gradient: "from-pink-300/90 to-rose-500/90", pattern: "radial-gradient(circle at 30% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "journaling": { gradient: "from-stone-400/90 to-amber-600/90", pattern: "radial-gradient(circle at 60% 30%, rgba(255,255,255,0.12) 0%, transparent 45%)" },
  "sunrise": { gradient: "from-yellow-300/90 to-rose-400/90", pattern: "radial-gradient(circle at 50% 90%, rgba(255,255,255,0.2) 0%, transparent 60%)" },
  "blood-pressure-check": { gradient: "from-red-400/90 to-rose-600/90", pattern: "radial-gradient(circle at 70% 40%, rgba(255,255,255,0.12) 0%, transparent 50%)" },
  "glucose-monitor": { gradient: "from-blue-400/90 to-sky-600/90", pattern: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "health-diary": { gradient: "from-emerald-400/90 to-green-600/90", pattern: "radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12) 0%, transparent 45%)" },
  "medication-tracking": { gradient: "from-indigo-400/90 to-blue-600/90", pattern: "radial-gradient(circle at 20% 40%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "celebration": { gradient: "from-yellow-400/90 to-amber-500/90", pattern: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)" },
  "achievement": { gradient: "from-emerald-400/90 to-teal-500/90", pattern: "radial-gradient(circle at 40% 60%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
  "progress-chart": { gradient: "from-blue-400/90 to-indigo-500/90", pattern: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.12) 0%, transparent 50%)" },
  "wellness-journey": { gradient: "from-teal-400/90 to-emerald-600/90", pattern: "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)" },
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

type LessonView = "intro" | "content" | "complete"

export default function EducationArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error, markViewed } = useEducationFeed()
  const { data: progressMap, saveProgress } = useLessonProgress()

  const card = data?.cards.find((c) => c.slug === slug)
  const sections = card?.sections ?? []
  const totalSections = sections.length

  const savedProgress = card ? progressMap?.[card.id] : null
  const initialSection = savedProgress?.completed
    ? 0
    : (savedProgress?.currentSection ?? 0)

  const [view, setView] = useState<LessonView>("intro")
  const [currentIndex, setCurrentIndex] = useState(initialSection)

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (savedProgress && !savedProgress.completed && savedProgress.currentSection > 0) {
      setCurrentIndex(savedProgress.currentSection)
    }
  }, [savedProgress])

  useEffect(() => {
    setView("intro")
    setCurrentIndex(0)
  }, [slug])

  useEffect(() => {
    if (card) {
      trackEvent(EVENTS.CARE_COMPANION.EDUCATION.CARD_VIEWED, {
        cardId: card.id,
        contentType: card.contentType,
        conditionType: card.conditionType,
        slug,
      })
    }
  }, [card, slug])

  const persistProgress = useCallback(
    (sectionIdx: number, completed: boolean) => {
      if (!card) return
      saveProgress.mutate({
        cardId: card.id,
        currentSection: sectionIdx,
        completed,
      })
    },
    [card, saveProgress],
  )

  const goNext = useCallback(() => {
    if (currentIndex < totalSections - 1) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      persistProgress(next, false)
    } else {
      setView("complete")
      persistProgress(currentIndex, true)
      if (card && !card.viewed) {
        markViewed.mutate(card.id)
      }
    }
  }, [currentIndex, totalSections, persistProgress, card, markViewed])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50
    if (diff > threshold) {
      goNext()
    } else if (diff < -threshold) {
      goPrev()
    }
  }, [goNext, goPrev])

  const startLesson = useCallback(
    (fromSection?: number) => {
      const idx = fromSection ?? 0
      setCurrentIndex(idx)
      setView("content")
      persistProgress(idx, false)
    },
    [persistProgress],
  )

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
          Could not load this lesson.
        </p>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Lesson not found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This lesson could not be found.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/patients/companion/education")}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Health Library
        </button>
      </div>
    )
  }

  if (totalSections === 0) {
    return <FallbackArticleView card={card} allCards={data.cards} />
  }

  if (view === "intro") {
    return (
      <IntroCard
        card={card}
        savedProgress={savedProgress}
        totalSections={totalSections}
        onStart={startLesson}
      />
    )
  }

  if (view === "complete") {
    return (
      <CompletionCard
        card={card}
        allCards={data.cards}
        totalSections={totalSections}
        onRestart={() => startLesson(0)}
      />
    )
  }

  const section = sections[currentIndex]

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <ProgressBar
        current={currentIndex}
        total={totalSections}
        contentType={card.contentType}
      />

      <div
        ref={cardRef}
        className="flex-1 flex flex-col px-4 pb-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SectionCard
          section={section}
          index={currentIndex}
          total={totalSections}
          contentType={card.contentType}
        />
      </div>

      <NavigationBar
        currentIndex={currentIndex}
        totalSections={totalSections}
        onPrev={goPrev}
        onNext={goNext}
        isLast={currentIndex === totalSections - 1}
      />
    </div>
  )
}

function ProgressBar({
  current,
  total,
  contentType,
}: {
  current: number
  total: number
  contentType: string
}) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0
  const config = CONTENT_TYPE_CONFIG[contentType]
  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-muted-foreground">
          {current + 1} of {total}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="flex h-full gap-0.5">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-full flex-1 rounded-full transition-all duration-300",
                i <= current
                  ? config?.bgColor
                    ? config.bgColor.replace("100", "500")
                    : "bg-primary"
                  : "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  section,
  index,
  total,
  contentType,
}: {
  section: EducationSection
  index: number
  total: number
  contentType: string
}) {
  const config = CONTENT_TYPE_CONFIG[contentType]
  const Icon = config?.icon ?? BookOpen

  return (
    <div className="flex-1 flex flex-col gap-4 pt-2 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            config?.bgColor ?? "bg-muted",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              config?.color ?? "text-muted-foreground",
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Part {index + 1} of {total}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-bold leading-snug text-foreground">
        {section.title}
      </h2>

      <div className="flex-1 overflow-y-auto space-y-3">
        {section.body.split("\n\n").map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground/90">
            {para}
          </p>
        ))}
      </div>
    </div>
  )
}

function NavigationBar({
  currentIndex,
  totalSections,
  onPrev,
  onNext,
  isLast,
}: {
  currentIndex: number
  totalSections: number
  onPrev: () => void
  onNext: () => void
  isLast: boolean
}) {
  return (
    <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
            currentIndex === 0
              ? "text-muted-foreground/40"
              : "text-foreground active:bg-muted",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex gap-1">
          {Array.from({ length: totalSections }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentIndex
                  ? "w-4 bg-primary"
                  : i < currentIndex
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted-foreground/20",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onNext}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
            isLast
              ? "bg-primary text-primary-foreground active:bg-primary/90"
              : "bg-primary text-primary-foreground active:bg-primary/90",
          )}
        >
          {isLast ? "Finish" : "Next"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function IntroCard({
  card,
  savedProgress,
  totalSections,
  onStart,
}: {
  card: EducationFeedCard
  savedProgress: { currentSection: number; completed: boolean } | null | undefined
  totalSections: number
  onStart: (fromSection?: number) => void
}) {
  const typeConfig = CONTENT_TYPE_CONFIG[card.contentType]
  const TypeIcon = typeConfig?.icon ?? BookOpen

  const theme = card.imageUrl ? IMAGE_THEMES[card.imageUrl] : null
  const gradient =
    theme?.gradient ??
    FALLBACK_GRADIENTS[card.contentType] ??
    "from-muted to-muted"
  const pattern =
    theme?.pattern ??
    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)"

  const canResume =
    savedProgress &&
    !savedProgress.completed &&
    savedProgress.currentSection > 0
  const isCompleted = savedProgress?.completed ?? false

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div
        className={cn(
          "relative h-48 w-full overflow-hidden bg-gradient-to-br",
          gradient,
        )}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundImage: pattern }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <TypeIcon className="h-20 w-20 text-white/20" />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 p-4">
        <div className="flex flex-wrap items-center gap-2">
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
              CONDITION_COLORS[card.conditionType] ??
                "bg-muted text-muted-foreground",
            )}
          >
            {CONDITION_LABELS[card.conditionType] ?? card.conditionType}
          </span>
        </div>

        <h1 className="text-xl font-bold leading-snug text-foreground">
          {card.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {card.estimatedMinutes ?? Math.max(1, Math.ceil(totalSections * 0.5))} min
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {totalSections} sections
          </span>
        </div>

        {card.learningObjectives && card.learningObjectives.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              What you will learn
            </h3>
            <ul className="space-y-2">
              {card.learningObjectives.map((obj, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground/80"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary/60 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">
          {card.summary}
        </p>

        <div className="mt-auto flex flex-col gap-2 pb-4">
          {isCompleted && (
            <button
              type="button"
              onClick={() => onStart(0)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Lesson
            </button>
          )}
          {canResume && !isCompleted && (
            <>
              <button
                type="button"
                onClick={() =>
                  onStart(savedProgress!.currentSection)
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
              >
                <PlayCircle className="h-4 w-4" />
                Continue from {savedProgress!.currentSection + 1}/
                {totalSections}
              </button>
              <button
                type="button"
                onClick={() => onStart(0)}
                className="flex items-center justify-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-medium text-foreground transition-colors active:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
                Start over
              </button>
            </>
          )}
          {!canResume && !isCompleted && (
            <button
              type="button"
              onClick={() => onStart(0)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
            >
              <PlayCircle className="h-4 w-4" />
              Start Lesson
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CompletionCard({
  card,
  allCards,
  totalSections,
  onRestart,
}: {
  card: EducationFeedCard
  allCards: EducationFeedCard[]
  totalSections: number
  onRestart: () => void
}) {
  const navigate = useNavigate()
  const typeConfig = CONTENT_TYPE_CONFIG[card.contentType]

  const recommended = allCards
    .filter(
      (c) =>
        c.id !== card.id &&
        !c.viewed &&
        (c.conditionType === card.conditionType ||
          c.contentType === card.contentType),
    )
    .slice(0, 3)

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] p-4">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">
            Lesson Complete!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You completed all {totalSections} sections of
          </p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {card.title}
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium text-foreground transition-colors active:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Review again
          </button>
          <button
            type="button"
            onClick={() => navigate("/patients/companion/education")}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors active:bg-primary/90"
          >
            <BookOpen className="h-3.5 w-3.5" />
            More lessons
          </button>
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="mt-4 pb-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Recommended next
          </h3>
          <div className="flex flex-col gap-2">
            {recommended.map((rec) => (
              <RecommendedCard key={rec.id} card={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RecommendedCard({ card }: { card: EducationFeedCard }) {
  const typeConfig = CONTENT_TYPE_CONFIG[card.contentType]
  const TypeIcon = typeConfig?.icon ?? BookOpen

  return (
    <Link
      to={`/patients/companion/education/${card.slug}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 no-underline transition-colors active:bg-muted/50"
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          typeConfig?.bgColor ?? "bg-muted",
        )}
      >
        <TypeIcon
          className={cn(
            "h-4 w-4",
            typeConfig?.color ?? "text-muted-foreground",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {card.title}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {CONDITION_LABELS[card.conditionType] ?? card.conditionType}
          {" · "}
          {card.sections?.length ?? 0} sections
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function FallbackArticleView({
  card,
  allCards,
}: {
  card: EducationFeedCard
  allCards: EducationFeedCard[]
}) {
  const typeConfig = CONTENT_TYPE_CONFIG[card.contentType]
  const TypeIcon = typeConfig?.icon ?? BookOpen
  const readTime = Math.max(1, Math.ceil(card.body.split(/\s+/).length / 200))

  const theme = card.imageUrl ? IMAGE_THEMES[card.imageUrl] : null
  const gradient =
    theme?.gradient ??
    FALLBACK_GRADIENTS[card.contentType] ??
    "from-muted to-muted"
  const pattern =
    theme?.pattern ??
    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)"

  const relatedCards = allCards
    .filter(
      (c) =>
        c.id !== card.id &&
        (c.conditionType === card.conditionType ||
          c.contentType === card.contentType),
    )
    .slice(0, 3)

  return (
    <div className="flex flex-col pb-24">
      <div
        className={cn(
          "relative h-44 w-full overflow-hidden bg-gradient-to-br",
          gradient,
        )}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundImage: pattern }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <TypeIcon className="h-20 w-20 text-white/20" />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
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
              CONDITION_COLORS[card.conditionType] ??
                "bg-muted text-muted-foreground",
            )}
          >
            {CONDITION_LABELS[card.conditionType] ?? card.conditionType}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {readTime} min read
          </span>
        </div>

        <h1 className="text-xl font-bold leading-snug text-foreground">
          {card.title}
        </h1>

        <div className="space-y-3">
          {card.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">
              {para}
            </p>
          ))}
        </div>

        {relatedCards.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Related lessons
            </h2>
            <div className="flex flex-col gap-2">
              {relatedCards.map((related) => (
                <RecommendedCard key={related.id} card={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
