import { useState, useEffect, useCallback } from "react"
import {
  BookOpen,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Home,
  DollarSign,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/analytics"
import { EVENTS } from "@/analytics"
import { useEducationFeed } from "./hooks/useEducationFeed"
import type { EducationFeedCard } from "./hooks/useEducationFeed"
import type { EducationContentType } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Filter chip definitions
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { label: string; value: EducationContentType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Dietary", value: "DIETARY" },
  { label: "Exercise", value: "EXERCISE" },
  { label: "Myth Busting", value: "MYTH_BUSTING" },
  { label: "Emotional", value: "EMOTIONAL" },
  { label: "Acceptance", value: "ACCEPTANCE" },
  { label: "Self Monitoring", value: "SELF_MONITORING" },
  { label: "Milestone", value: "MILESTONE" },
]

// ---------------------------------------------------------------------------
// Content type badge color mapping
// ---------------------------------------------------------------------------

const CONTENT_TYPE_STYLE: Record<string, string> = {
  DIETARY: "bg-success text-green-800",
  EXERCISE: "bg-blue-100 text-blue-800",
  MYTH_BUSTING: "bg-warning text-amber-800",
  EMOTIONAL: "bg-purple-100 text-purple-800",
  ACCEPTANCE: "bg-accent text-teal-800",
  SELF_MONITORING: "bg-indigo-100 text-indigo-800",
  MILESTONE: "bg-yellow-100 text-yellow-800",
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  DIETARY: "Dietary",
  EXERCISE: "Exercise",
  MYTH_BUSTING: "Myth Busting",
  EMOTIONAL: "Emotional",
  ACCEPTANCE: "Acceptance",
  SELF_MONITORING: "Self Monitoring",
  MILESTONE: "Milestone",
}

const CONDITION_TYPE_STYLE: Record<string, string> = {
  DIABETES: "bg-orange-100 text-orange-800",
  HYPERTENSION: "bg-red-100 text-red-800",
  GENERAL: "bg-muted text-muted-foreground",
}

const CONDITION_TYPE_LABEL: Record<string, string> = {
  DIABETES: "Diabetes",
  HYPERTENSION: "Hypertension",
  GENERAL: "General",
}

// ---------------------------------------------------------------------------
// EducationFeedPage
// ---------------------------------------------------------------------------

export default function EducationFeedPage() {
  const { data, isLoading, error, markViewed } = useEducationFeed()
  const [activeFilter, setActiveFilter] = useState<EducationContentType | "ALL">("ALL")
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.EDUCATION.VIEW)
  }, [])

  const handleCardTap = useCallback(
    (card: EducationFeedCard) => {
      const isExpanding = expandedCardId !== card.id

      if (isExpanding) {
        setExpandedCardId(card.id)
        trackEvent(EVENTS.CARE_COMPANION.EDUCATION.CARD_VIEWED, {
          cardId: card.id,
          contentType: card.contentType,
          conditionType: card.conditionType,
        })

        if (!card.viewed) {
          markViewed.mutate(card.id)
        }

        trackEvent(EVENTS.CARE_COMPANION.EDUCATION.CARD_COMPLETE, {
          cardId: card.id,
          contentType: card.contentType,
        })
      } else {
        setExpandedCardId(null)
      }
    },
    [expandedCardId, markViewed],
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
          Could not load education articles.
        </p>
      </div>
    )
  }

  const filteredCards =
    activeFilter === "ALL"
      ? data.cards
      : data.cards.filter((c) => c.contentType === activeFilter)

  const allRead = filteredCards.length === 0

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Education Feed
          </h1>
          <p className="text-xs text-muted-foreground">
            Weekly articles to help you manage your health
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveFilter(option.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeFilter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground active:bg-muted/80",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {allRead ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Sparkles className="h-6 w-6 text-teal-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            You've read all available articles. Check back next week.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredCards.map((card) => (
            <EducationCard
              key={card.id}
              card={card}
              isExpanded={expandedCardId === card.id}
              onTap={handleCardTap}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EducationCard
// ---------------------------------------------------------------------------

function EducationCard({
  card,
  isExpanded,
  onTap,
}: {
  card: EducationFeedCard
  isExpanded: boolean
  onTap: (card: EducationFeedCard) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onTap(card)}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left transition-colors",
        isExpanded ? "border-primary/30 bg-secondary/30" : "active:bg-muted/50",
      )}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">
              {card.title}
            </h3>
            {!card.viewed && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            )}
          </div>

          {/* Badges */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                CONTENT_TYPE_STYLE[card.contentType] ?? "bg-muted text-muted-foreground",
              )}
            >
              {CONTENT_TYPE_LABEL[card.contentType] ?? card.contentType}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                CONDITION_TYPE_STYLE[card.conditionType] ?? "bg-muted text-muted-foreground",
              )}
            >
              {CONDITION_TYPE_LABEL[card.conditionType] ?? card.conditionType}
            </span>
            {card.householdCompatible && (
              <span className="flex items-center gap-0.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-teal-800">
                <Home className="h-2.5 w-2.5" />
                Household
              </span>
            )}
            {card.costNeutral && (
              <span className="flex items-center gap-0.5 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-green-800">
                <DollarSign className="h-2.5 w-2.5" />
                Cost-neutral
              </span>
            )}
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div className="mt-3 border-t pt-3">
          <p className="text-sm leading-relaxed text-foreground/90">
            {card.body}
          </p>
        </div>
      )}
    </button>
  )
}
