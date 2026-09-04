import { cn } from "@/lib/utils"
import type { TimelineCardType } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Filter key type
//
// Extends TimelineCardType with composite filter keys that the parent
// page/hook interprets to include/exclude the right card types.
// ---------------------------------------------------------------------------

export type CareHistoryFilterKey =
  | TimelineCardType
  | "MEDICATIONS"
  | "LAB_TESTS"
  | "INSIGHTS"

// ---------------------------------------------------------------------------
// Composite filter mapping
//
// Maps composite filter keys to the concrete TimelineCardType values they
// include. The care history hook MUST use this mapping when filtering
// entries rather than strict equality, because composite keys like
// "MEDICATIONS" don't correspond to any single card type.
//
// Example hook usage:
//   const types = COMPOSITE_FILTER_MAP[activeFilter]
//   if (types) {
//     filtered = entries.filter(e => types.includes(e.type) || e.type === "UPCOMING")
//   } else {
//     filtered = entries.filter(e => e.type === activeFilter || e.type === "UPCOMING")
//   }
// ---------------------------------------------------------------------------

export const COMPOSITE_FILTER_MAP: Partial<
  Record<CareHistoryFilterKey, TimelineCardType[]>
> = {
  MEDICATIONS: ["SCHEDULE_CHANGE", "DRUG_INTERACTION", "VISIT_GROUP"],
  LAB_TESTS: ["TEST_RESULT", "SCHEDULE_CHANGE"],
  INSIGHTS: ["AI_INSIGHT"],
}

// ---------------------------------------------------------------------------
// Chip definitions
// ---------------------------------------------------------------------------

interface FilterChipDef {
  label: string
  value: CareHistoryFilterKey | null
}

const EVENT_TYPE_CHIPS: FilterChipDef[] = [
  { label: "All", value: null },
  { label: "Visits", value: "VISIT_GROUP" },
  { label: "Medications", value: "MEDICATIONS" },
  { label: "Lab Tests", value: "LAB_TESTS" },
  { label: "Insights", value: "INSIGHTS" },
]

// ---------------------------------------------------------------------------
// EventTypeFilterChips
// ---------------------------------------------------------------------------

interface EventTypeFilterChipsProps {
  activeFilter: CareHistoryFilterKey | null
  onFilterChange: (filter: CareHistoryFilterKey | null) => void
}

export function EventTypeFilterChips({
  activeFilter,
  onFilterChange,
}: EventTypeFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {EVENT_TYPE_CHIPS.map((chip) => {
        const isActive =
          chip.value === null
            ? activeFilter === null
            : activeFilter === chip.value

        return (
          <button
            key={chip.label}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (isActive && chip.value !== null) {
                onFilterChange(null)
              } else {
                onFilterChange(chip.value)
              }
            }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground active:bg-muted/80"
            )}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FacilityFilterChips
// ---------------------------------------------------------------------------

interface FacilityFilterChipsProps {
  facilities: string[]
  activeFilter: string | null
  onFilterChange: (filter: string | null) => void
}

export function FacilityFilterChips({
  facilities,
  activeFilter,
  onFilterChange,
}: FacilityFilterChipsProps) {
  if (facilities.length <= 1) return null

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {facilities.map((facility) => {
        const isActive = activeFilter === facility

        return (
          <button
            key={facility}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              onFilterChange(isActive ? null : facility)
            }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground active:bg-muted/80"
            )}
          >
            {facility}
          </button>
        )
      })}
    </div>
  )
}
