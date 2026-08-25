import IntakeOption from "../components/IntakeOption"
import type { CareCompanionProfile } from "@/types/care-companion"

type GoalsData = CareCompanionProfile["goals"]
type GoalValue = GoalsData["selected"][number]

interface GoalsStepProps {
  data: GoalsData
  onUpdate: (data: GoalsData) => void
}

const GOAL_OPTIONS: { value: GoalValue; label: string }[] = [
  {
    value: "TRACK_COSTS",
    label: "Track how much I spend on healthcare",
  },
  {
    value: "MEDICATION_REMINDERS",
    label: "Remind me when to refill my medication",
  },
  {
    value: "UNDERSTAND_MEDICATION",
    label: "Help me understand what my medication does and its side effects",
  },
  {
    value: "FIND_AFFORDABLE_PHARMACY",
    label:
      "Find an affordable pharmacy near me that has my medication in stock",
  },
  {
    value: "EMERGENCY_HELP",
    label: "Help me in a medical emergency",
  },
  {
    value: "DIET_TIPS",
    label: "Give me diet tips that work for my whole family",
  },
  {
    value: "EXERCISE_GUIDANCE",
    label: "Guide me on safe exercise for my condition",
  },
  {
    value: "EMOTIONAL_SUPPORT",
    label: "Support me emotionally",
  },
  {
    value: "CREDIT_FOR_MEDICATION",
    label: "Help me get credit when I can't afford medication",
  },
  {
    value: "SHARE_WITH_FAMILY",
    label: "Help me share my health costs with family",
  },
]

export default function GoalsStep({ data, onUpdate }: GoalsStepProps) {
  function toggleGoal(goal: GoalValue) {
    const current = data.selected
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal]
    onUpdate({ selected: updated })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 >
          What would you like Jireh Care Companion to help you with?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select all that apply
        </p>
      </div>

      <div
        className="flex flex-col gap-3"
        role="group"
        aria-label="Care companion goals"
      >
        {GOAL_OPTIONS.map(({ value, label }) => (
          <IntakeOption
            key={value}
            label={label}
            selected={data.selected.includes(value)}
            onToggle={() => toggleGoal(value)}
            mode="checkbox"
          />
        ))}
      </div>

      {data.selected.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Select at least one to continue
        </p>
      )}
    </div>
  )
}
