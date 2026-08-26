import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pill,
  ShieldAlert,
  Thermometer,
  PackageOpen,
  Info,
  AlertCircle,
  Ban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { useMedicationCards } from "./hooks/useMedicationCards"
import type {
  AnnotatedMedicationCard,
  AnnotatedInteraction,
} from "./hooks/useMedicationCards"
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
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [expandedInteractionCardId, setExpandedInteractionCardId] =
    useState<string | null>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const hasAutoExpanded = useRef(false)

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_CARDS.VIEW)
  }, [])

  useEffect(() => {
    if (!highlightMed || !data || hasAutoExpanded.current) return
    const match = data.cards.find((c) =>
      c.genericName.toLowerCase().includes(highlightMed.toLowerCase()),
    )
    if (match) {
      hasAutoExpanded.current = true
      setExpandedCardId(match.card.id)
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
          Tap a card to learn more about your medication
        </p>
      </div>

      {data.cards.map((annotatedCard) => {
        const isExpanded = expandedCardId === annotatedCard.card.id
        const isInteractionExpanded =
          expandedInteractionCardId === annotatedCard.card.id
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
            className={cn(
              "rounded-xl border border-l-4 bg-card transition-all",
              borderClass,
              isHighlighted && "ring-2 ring-primary/40",
            )}
          >
            <CollapsedView
              annotatedCard={annotatedCard}
              isExpanded={isExpanded}
              onToggle={() => {
                const nextId = isExpanded ? null : annotatedCard.card.id
                setExpandedCardId(nextId)
                if (nextId) {
                  trackEvent(
                    EVENTS.CARE_COMPANION.MEDICATION_CARDS.CARD_EXPAND,
                    {
                      medicationCardId: annotatedCard.card.id,
                      genericName: annotatedCard.genericName,
                    },
                  )
                }
              }}
            />

            {isExpanded && (
              <ExpandedView
                annotatedCard={annotatedCard}
                isInteractionExpanded={isInteractionExpanded}
                onToggleInteractions={() => {
                  const nextId = isInteractionExpanded
                    ? null
                    : annotatedCard.card.id
                  setExpandedInteractionCardId(nextId)
                  if (nextId) {
                    trackEvent(
                      EVENTS.CARE_COMPANION.MEDICATION_CARDS
                        .INTERACTION_WARNING_TAP,
                      {
                        medicationCardId: annotatedCard.card.id,
                        genericName: annotatedCard.genericName,
                        interactionCount: annotatedCard.interactions.length,
                      },
                    )
                  }
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CollapsedView({
  annotatedCard,
  isExpanded,
  onToggle,
}: {
  annotatedCard: AnnotatedMedicationCard
  isExpanded: boolean
  onToggle: () => void
}) {
  const { genericName, brandNames, category, strengths, interactions } =
    annotatedCard
  const hasInteractions = interactions.length > 0
  const maxSeverity = getMaxSeverity(interactions)

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between p-4 text-left"
      aria-expanded={isExpanded}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {genericName}
          </h3>
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">
            {formatCategory(category)}
          </span>
        </div>

        {brandNames.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {brandNames.join(", ")}
          </p>
        )}

        {strengths.length > 0 && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {strengths.join(" / ")}
          </p>
        )}

        {hasInteractions && maxSeverity && (
          <div className="mt-2 flex items-center gap-1.5">
            <InteractionBadge
              severity={maxSeverity}
              count={interactions.length}
            />
          </div>
        )}
      </div>

      <div className="ml-2 mt-1 shrink-0">
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </button>
  )
}

function ExpandedView({
  annotatedCard,
  isInteractionExpanded,
  onToggleInteractions,
}: {
  annotatedCard: AnnotatedMedicationCard
  isInteractionExpanded: boolean
  onToggleInteractions: () => void
}) {
  const { card, interactions } = annotatedCard
  const hasInteractions = interactions.length > 0

  return (
    <div className="border-t px-4 pb-4 pt-3">
      {/* What it does */}
      {card.description && (
        <InfoSection
          icon={<Pill className="h-4 w-4 text-primary" />}
          title="What it does"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </InfoSection>
      )}

      {/* How to take */}
      {card.howItWorks && (
        <InfoSection
          icon={<Thermometer className="h-4 w-4 text-primary" />}
          title="How it works"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {card.howItWorks}
          </p>
        </InfoSection>
      )}

      {/* Common side effects */}
      {card.commonSideEffects.length > 0 && (
        <InfoSection
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
          title="Common side effects"
        >
          <ul className="space-y-2">
            {card.commonSideEffects.map((se) => (
              <li key={se.effect} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {se.effect}
                </span>
                {se.frequency && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {se.frequency}
                  </span>
                )}
                {se.advice && (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {se.advice}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </InfoSection>
      )}

      {/* Serious side effects */}
      {card.seriousSideEffects.length > 0 && (
        <InfoSection
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
          title="Serious side effects"
        >
          <ul className="space-y-2">
            {card.seriousSideEffects.map((se) => (
              <li key={se.effect} className="text-xs">
                <span className="font-medium text-foreground">
                  {se.effect}
                </span>
                <p className="mt-0.5 text-[11px] font-medium text-destructive">
                  {se.action}
                </p>
              </li>
            ))}
          </ul>
        </InfoSection>
      )}

      {/* Things to avoid */}
      {card.avoidanceWarnings.length > 0 && (
        <InfoSection
          icon={<Ban className="h-4 w-4 text-amber-500" />}
          title="Things to avoid"
        >
          <ul className="space-y-2">
            {card.avoidanceWarnings.map((aw) => (
              <li key={aw.substance} className="text-xs">
                <span className="font-medium text-foreground">
                  {aw.substance}
                </span>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {aw.reason}
                </p>
              </li>
            ))}
          </ul>
        </InfoSection>
      )}

      {/* Storage instructions */}
      {card.storageInstructions && (
        <InfoSection
          icon={<PackageOpen className="h-4 w-4 text-muted-foreground" />}
          title="Storage"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {card.storageInstructions}
          </p>
        </InfoSection>
      )}

      {/* When to seek help */}
      {card.whenToSeekHelp && (
        <InfoSection
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          title="When to seek help"
        >
          <p className="text-xs leading-relaxed text-destructive/80">
            {card.whenToSeekHelp}
          </p>
        </InfoSection>
      )}

      {/* Interaction warnings */}
      {hasInteractions && (
        <InteractionWarnings
          interactions={interactions}
          isExpanded={isInteractionExpanded}
          onToggle={onToggleInteractions}
        />
      )}
    </div>
  )
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      {children}
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

function InteractionWarnings({
  interactions,
  isExpanded,
  onToggle,
}: {
  interactions: AnnotatedInteraction[]
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-900">
            {interactions.length} interaction warning
            {interactions.length !== 1 ? "s" : ""}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {interactions.map((interaction) => {
            const config = SEVERITY_CONFIG[interaction.severity]

            return (
              <div
                key={`${interaction.withMedication}-${interaction.severity}`}
                className={cn(
                  "rounded-md border-l-2 bg-white p-3",
                  config.borderClass,
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    {interaction.withMedication}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      config.badgeClass,
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {interaction.description}
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-foreground">
                  {interaction.recommendation}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
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
