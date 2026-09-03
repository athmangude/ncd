import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,

  Pill,
  ShieldAlert,
  Thermometer,
  PackageOpen,
  Info,
  AlertCircle,
  Ban,
  ArrowLeft,
} from "lucide-react"
import { useState } from "react"
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

export default function MedicationCardDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useMedicationCards()
  const [isInteractionExpanded, setIsInteractionExpanded] = useState(false)

  const card = data?.cards.find((c) => c.slug === slug)

  useEffect(() => {
    if (card) {
      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_CARDS.CARD_EXPAND, {
        medicationCardId: card.card.id,
        genericName: card.genericName,
        slug,
      })
    }
  }, [card, slug])

  if (isLoading) {
    return <MedicationDetailSkeleton />
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load medication information.
        </p>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Pill className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Medication not found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This medication card could not be found.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/patients/companion/medication-cards")}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          View all medications
        </button>
      </div>
    )
  }

  const maxSeverity = getMaxSeverity(card.interactions)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">
            {card.genericName}
          </h1>
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">
            {formatCategory(card.category)}
          </span>
        </div>

        {card.brandNames.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {card.brandNames.join(", ")}
          </p>
        )}

        {card.strengths.length > 0 && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {card.strengths.join(" / ")}
          </p>
        )}

        {maxSeverity && (
          <div className="mt-2">
            <InteractionBadge
              severity={maxSeverity}
              count={card.interactions.length}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {card.card.description && (
          <InfoSection
            icon={<Pill className="h-4 w-4 text-primary" />}
            title="What it does"
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              {card.card.description}
            </p>
          </InfoSection>
        )}

        {card.card.howItWorks && (
          <InfoSection
            icon={<Thermometer className="h-4 w-4 text-primary" />}
            title="How it works"
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              {card.card.howItWorks}
            </p>
          </InfoSection>
        )}

        {card.card.commonSideEffects.length > 0 && (
          <InfoSection
            icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
            title="Common side effects"
          >
            <ul className="space-y-2">
              {card.card.commonSideEffects.map((se) => (
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

        {card.card.seriousSideEffects.length > 0 && (
          <InfoSection
            icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
            title="Serious side effects"
          >
            <ul className="space-y-2">
              {card.card.seriousSideEffects.map((se) => (
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

        {card.card.avoidanceWarnings.length > 0 && (
          <InfoSection
            icon={<Ban className="h-4 w-4 text-amber-500" />}
            title="Things to avoid"
          >
            <ul className="space-y-2">
              {card.card.avoidanceWarnings.map((aw) => (
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

        {card.card.storageInstructions && (
          <InfoSection
            icon={<PackageOpen className="h-4 w-4 text-muted-foreground" />}
            title="Storage"
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              {card.card.storageInstructions}
            </p>
          </InfoSection>
        )}

        {card.card.whenToSeekHelp && (
          <InfoSection
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            title="When to seek help"
          >
            <p className="text-xs leading-relaxed text-destructive/80">
              {card.card.whenToSeekHelp}
            </p>
          </InfoSection>
        )}

        {card.interactions.length > 0 && (
          <InteractionWarnings
            interactions={card.interactions}
            isExpanded={isInteractionExpanded}
            onToggle={() => setIsInteractionExpanded((v) => !v)}
          />
        )}
      </div>
    </div>
  )
}

function MedicationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
        </div>
        <div className="mt-1 h-3.5 w-32 rounded bg-muted" />
        <div className="mt-1 h-3.5 w-24 rounded bg-muted" />
      </div>

      {[
        { titleW: "w-24", lines: 2 },
        { titleW: "w-28", lines: 3 },
        { titleW: "w-36", lines: 4 },
        { titleW: "w-28", lines: 2 },
      ].map((section, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className={cn("h-3.5 rounded bg-muted", section.titleW)} />
          </div>
          <div className="space-y-2">
            {Array.from({ length: section.lines }, (_, j) => (
              <div
                key={j}
                className={cn(
                  "h-3.5 rounded bg-muted",
                  j === section.lines - 1 ? "w-3/4" : "w-full",
                )}
              />
            ))}
          </div>
        </div>
      ))}
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
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5">
        {icon}
        <h2 className="text-xs font-semibold text-foreground">{title}</h2>
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
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
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

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    MEDICATION: "Medication",
    LAB_TEST: "Lab Test",
    CONSULTATION: "Consultation",
    SUPPLY: "Supply",
  }
  return labels[category] ?? category
}
