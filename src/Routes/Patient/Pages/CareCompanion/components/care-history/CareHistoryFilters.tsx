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
    <div className="flex gap-2 overflow-x-auto scrollbar-none">
      {EVENT_TYPE_CHIPS.map((chip) => {
        const isActive =
          chip.value === null
            ? activeFilter === null
            : activeFilter === chip.value

        return (
          <button
            key={chip.label}
            type="button"
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
    <div className="flex gap-2 overflow-x-auto scrollbar-none">
      {facilities.map((facility) => {
        const isActive = activeFilter === facility

        return (
          <button
            key={facility}
            type="button"
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
