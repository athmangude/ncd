import { useState, useCallback, useRef, useEffect } from "react"
import {
  Pill,
  AlertCircle,
  ShieldAlert,
  Ban,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Thermometer,
  PackageOpen,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/Drawer"
import { trackEvent, EVENTS } from "@/analytics"
import { useMedicationCards } from "../hooks/useMedicationCards"
import type {
  AnnotatedMedicationCard,
  AnnotatedInteraction,
} from "../hooks/useMedicationCards"
import type { InteractionSeverity } from "@/types/care-companion"

interface MedicationCardDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMedicationId?: string
}

const SEVERITY_CONFIG: Record<
  InteractionSeverity,
  { label: string; badgeClass: string; icon: typeof AlertCircle }
> = {
  MILD: {
    label: "Mild",
    badgeClass: "bg-blue-100 text-blue-700",
    icon: AlertCircle,
  },
  MODERATE: {
    label: "Moderate",
    badgeClass: "bg-amber-100 text-amber-700",
    icon: AlertCircle,
  },
  SEVERE: {
    label: "Severe",
    badgeClass: "bg-red-100 text-red-700",
    icon: ShieldAlert,
  },
  CONTRAINDICATED: {
    label: "Contraindicated",
    badgeClass: "bg-red-200 text-red-900",
    icon: Ban,
  },
}

export function MedicationCardDrawer({
  open,
  onOpenChange,
  initialMedicationId,
}: MedicationCardDrawerProps) {
  const { data, isLoading } = useMedicationCards()
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)
  const cardContainerRef = useRef<HTMLDivElement>(null)

  const cards = data?.cards ?? []

  useEffect(() => {
    if (!open || cards.length === 0) return
    if (initialMedicationId) {
      const idx = cards.findIndex(
        (c) => c.card.medicationId === initialMedicationId,
      )
      if (idx >= 0) setActiveIndex(idx)
    } else {
      setActiveIndex(0)
    }
  }, [open, cards, initialMedicationId])

  useEffect(() => {
    if (open && cards.length > 0) {
      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_CARDS.VIEW, {
        source: "drawer",
        cardCount: cards.length,
      })
    }
  }, [open, cards.length])

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (cards.length === 0) return
      const next =
        direction === "left"
          ? Math.min(activeIndex + 1, cards.length - 1)
          : Math.max(activeIndex - 1, 0)
      if (next !== activeIndex) {
        setActiveIndex(next)
        trackEvent(EVENTS.CARE_COMPANION.MEDICATION_CARDS.CARD_SWIPE, {
          direction,
          fromIndex: activeIndex,
          toIndex: next,
          medicationId: cards[next].card.medicationId,
        })
      }
    },
    [activeIndex, cards],
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(touchDeltaX.current) > 50) {
      handleSwipe(touchDeltaX.current < 0 ? "left" : "right")
    }
    touchDeltaX.current = 0
  }, [handleSwipe])

  const handleDismiss = useCallback(() => {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_CARDS.OVERLAY_DISMISS, {
      viewedIndex: activeIndex,
      totalCards: cards.length,
    })
    onOpenChange(false)
  }, [activeIndex, cards.length, onOpenChange])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] max-h-[85dvh]">
        <DrawerHeader className="relative">
          <DrawerTitle className="text-center">
            Your Medications
          </DrawerTitle>
          <DrawerDescription className="text-center">
            Swipe to browse your medication information
          </DrawerDescription>
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-0 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </DrawerHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Pill className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No medication cards available yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-6">
            {cards.length > 1 && (
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => handleSwipe("right")}
                  disabled={activeIndex === 0}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xs font-medium text-muted-foreground">
                  {activeIndex + 1} of {cards.length}
                </span>
                <button
                  type="button"
                  onClick={() => handleSwipe("left")}
                  disabled={activeIndex === cards.length - 1}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            <div
              ref={cardContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="overflow-hidden"
            >
              <MedicationCardContent card={cards[activeIndex]} />
            </div>

            {cards.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {cards.map((c, i) => (
                  <button
                    key={c.card.id}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === activeIndex
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function MedicationCardContent({
  card: annotatedCard,
}: {
  card: AnnotatedMedicationCard
}) {
  const { card, interactions, genericName, brandNames, strengths } =
    annotatedCard

  return (
    <div className="space-y-4 overflow-y-auto rounded-xl border bg-card p-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {genericName}
        </h3>
        {brandNames.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {brandNames.join(", ")}
          </p>
        )}
        {strengths.length > 0 && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {strengths.join(" / ")}
          </p>
        )}
      </div>

      {card.description && (
        <DrawerInfoSection
          icon={<Pill className="h-4 w-4 text-primary" />}
          title="What it does"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </DrawerInfoSection>
      )}

      {card.howItWorks && (
        <DrawerInfoSection
          icon={<Thermometer className="h-4 w-4 text-primary" />}
          title="How it works"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {card.howItWorks}
          </p>
        </DrawerInfoSection>
      )}

      {card.commonSideEffects.length > 0 && (
        <DrawerInfoSection
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
          title="Common side effects"
        >
          <ul className="space-y-1.5">
            {card.commonSideEffects.slice(0, 3).map((se) => (
              <li key={se.effect} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {se.effect}
                </span>
                {se.advice && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {se.advice}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </DrawerInfoSection>
      )}

      {card.seriousSideEffects.length > 0 && (
        <DrawerInfoSection
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
          title="Serious side effects"
        >
          <ul className="space-y-1.5">
            {card.seriousSideEffects.map((se) => (
              <li key={se.effect} className="text-xs">
                <span className="font-medium text-foreground">
                  {se.effect}
                </span>
                <p className="text-[11px] font-medium text-destructive">
                  {se.action}
                </p>
              </li>
            ))}
          </ul>
        </DrawerInfoSection>
      )}

      {card.avoidanceWarnings.length > 0 && (
        <DrawerInfoSection
          icon={<Ban className="h-4 w-4 text-amber-500" />}
          title="Things to avoid"
        >
          <ul className="space-y-1.5">
            {card.avoidanceWarnings.map((aw) => (
              <li key={aw.substance} className="text-xs">
                <span className="font-medium text-foreground">
                  {aw.substance}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  — {aw.reason}
                </span>
              </li>
            ))}
          </ul>
        </DrawerInfoSection>
      )}

      {card.storageInstructions && (
        <DrawerInfoSection
          icon={<PackageOpen className="h-4 w-4 text-muted-foreground" />}
          title="Storage"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {card.storageInstructions}
          </p>
        </DrawerInfoSection>
      )}

      {card.whenToSeekHelp && (
        <DrawerInfoSection
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          title="When to seek help"
        >
          <p className="text-xs leading-relaxed text-destructive/80">
            {card.whenToSeekHelp}
          </p>
        </DrawerInfoSection>
      )}

      {interactions.length > 0 && (
        <DrawerInfoSection
          icon={<ShieldAlert className="h-4 w-4 text-amber-600" />}
          title={`${interactions.length} interaction warning${interactions.length !== 1 ? "s" : ""}`}
        >
          <ul className="space-y-2">
            {interactions.map((interaction) => (
              <InteractionItem
                key={`${interaction.withMedication}-${interaction.severity}`}
                interaction={interaction}
              />
            ))}
          </ul>
        </DrawerInfoSection>
      )}
    </div>
  )
}

function DrawerInfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function InteractionItem({
  interaction,
}: {
  interaction: AnnotatedInteraction
}) {
  const config = SEVERITY_CONFIG[interaction.severity]

  return (
    <li className="rounded-md border bg-muted/30 p-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">
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
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {interaction.description}
      </p>
    </li>
  )
}
