import { useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  Pill,
  ShieldAlert,
  Info,
  AlertCircle,
  Ban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { useMedicationCards } from "./hooks/useMedicationCards"
import type { AnnotatedInteraction } from "./hooks/useMedicationCards"
import type { InteractionSeverity } from "@/types/care-companion"

const SEVERITY_CONFIG: Record<
  InteractionSeverity,
  { label: string; badgeClass: string; borderClass: string; icon: typeof Info }
> = {
  MILD: {
    label: "Mild",
    badgeClass: "bg-blue-100 text-blue-700",
    borderClass: "border-l-blue-400",
    icon: Info,
  },
  MODERATE: {
    label: "Moderate",
    badgeClass: "bg-amber-100 text-amber-700",
    borderClass: "border-l-amber-400",
    icon: AlertCircle,
  },
  SEVERE: {
    label: "Severe",
    badgeClass: "bg-red-100 text-red-700",
    borderClass: "border-l-red-500",
    icon: ShieldAlert,
  },
  CONTRAINDICATED: {
    label: "Contraindicated",
    badgeClass: "bg-red-200 text-red-900",
    borderClass: "border-l-red-700",
    icon: Ban,
  },
}

function getMaxSeverity(
  interactions: AnnotatedInteraction[],
): InteractionSeverity | null {
  if (interactions.length === 0) return null
  const rank: Record<InteractionSeverity, number> = {
    MILD: 1,
    MODERATE: 2,
    SEVERE: 3,
    CONTRAINDICATED: 4,
  }
  return interactions.reduce<InteractionSeverity>(
    (max, i) =>
      (rank[i.severity] ?? 0) > (rank[max] ?? 0) ? i.severity : max,
    interactions[0].severity,
  )
}

export default function MedicationCardsPage() {
  const { data, isLoading, error } = useMedicationCards()
  const [searchParams] = useSearchParams()
  const highlightMed = searchParams.get("highlight")
  const highlightRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_CARDS.VIEW)
  }, [])

  useEffect(() => {
    if (!highlightMed || !data || hasScrolled.current) return
    const match = data.cards.find((c) =>
      c.genericName.toLowerCase().includes(highlightMed.toLowerCase()),
    )
    if (match) {
      hasScrolled.current = true
      requestAnimationFrame(() => {
        highlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      })
    }
  }, [highlightMed, data])

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
          Could not load your medication information.
        </p>
      </div>
    )
  }

  if (data.cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Pill className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">
            No medication cards yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Medication information cards will appear here once your medications
            are recorded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="mb-1">
        <h1 className="text-lg font-semibold text-foreground">
          Your Medications
        </h1>
        <p className="text-xs text-muted-foreground">
          Tap a medication to learn more
        </p>
      </div>

      {data.cards.map((annotatedCard) => {
        const maxSeverity = getMaxSeverity(annotatedCard.interactions)
        const borderClass = maxSeverity
          ? SEVERITY_CONFIG[maxSeverity].borderClass
          : "border-l-transparent"
        const isHighlighted =
          highlightMed &&
          annotatedCard.genericName
            .toLowerCase()
            .includes(highlightMed.toLowerCase())

        return (
          <div
            key={annotatedCard.card.id}
            ref={isHighlighted ? highlightRef : undefined}
          >
            <Link
              to={`/patients/companion/medication-cards/${annotatedCard.slug}`}
              className={cn(
                "flex items-center justify-between rounded-xl border border-l-4 bg-card p-4 transition-all",
                borderClass,
                isHighlighted && "ring-2 ring-primary/40",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {annotatedCard.genericName}
                  </h3>
                  <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {formatCategory(annotatedCard.category)}
                  </span>
                </div>

                {annotatedCard.brandNames.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {annotatedCard.brandNames.join(", ")}
                  </p>
                )}

                {annotatedCard.strengths.length > 0 && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {annotatedCard.strengths.join(" / ")}
                  </p>
                )}

                {maxSeverity && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <InteractionBadge
                      severity={maxSeverity}
                      count={annotatedCard.interactions.length}
                    />
                  </div>
                )}
              </div>

              <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function InteractionBadge({
  severity,
  count,
}: {
  severity: InteractionSeverity
  count: number
}) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        config.badgeClass,
      )}
    >
      <Icon className="h-3 w-3" />
      {count} interaction{count !== 1 ? "s" : ""} ({config.label})
    </span>
  )
}

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    MEDICATION: "Medication",
    LAB_TEST: "Lab Test",
    CONSULTATION: "Consultation",
    SUPPLY: "Supply",
  }
  return labels[category] ?? category
}
