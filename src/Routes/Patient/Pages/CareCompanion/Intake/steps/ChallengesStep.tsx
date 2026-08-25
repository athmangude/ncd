import IntakeOption from "../components/IntakeOption"
import type { CareCompanionProfile } from "@/types/care-companion"

type ChallengesData = CareCompanionProfile["challenges"]
type ChallengeValue = ChallengesData["selected"][number]

interface ChallengesStepProps {
  data: ChallengesData
  onUpdate: (data: ChallengesData) => void
}

const MAX_SELECTIONS = 5

const CHALLENGE_OPTIONS: { value: ChallengeValue; label: string }[] = [
  { value: "COST", label: "Affording medication and treatment" },
  {
    value: "UNDERSTANDING_MEDICATION",
    label: "Understanding what my medication does",
  },
  { value: "DIET", label: "Eating the right foods on a family budget" },
  { value: "EXERCISE", label: "Staying physically active" },
  { value: "SIDE_EFFECTS", label: "Dealing with side effects" },
  {
    value: "FINDING_PHARMACY",
    label: "Finding a pharmacy that has my medication",
  },
  { value: "EMOTIONAL", label: "Feeling stressed, anxious, or overwhelmed" },
  { value: "FAMILY_SUPPORT", label: "Getting support from family" },
  {
    value: "EMERGENCY_PREPAREDNESS",
    label: "Being ready for an emergency",
  },
  {
    value: "NAVIGATING_SYSTEM",
    label: "Navigating hospitals and the healthcare system",
  },
  {
    value: "STIGMA",
    label: "Accepting my diagnosis or feeling judged",
  },
]

function challengeLabel(value: string): string {
  return (
    CHALLENGE_OPTIONS.find((o) => o.value === value)?.label ?? value
  )
}

export default function ChallengesStep({
  data,
  onUpdate,
}: ChallengesStepProps) {
  function toggleChallenge(challenge: ChallengeValue) {
    const current = data.selected
    const isSelected = current.includes(challenge)

    let updated: ChallengeValue[]
    if (isSelected) {
      updated = current.filter((c) => c !== challenge)
    } else {
      if (current.length >= MAX_SELECTIONS) return
      updated = [...current, challenge]
    }

    const topChallenge =
      data.topChallenge && updated.includes(data.topChallenge as ChallengeValue)
        ? data.topChallenge
        : null

    onUpdate({ selected: updated, topChallenge })
  }

  function setTopChallenge(challenge: string) {
    onUpdate({
      ...data,
      topChallenge: data.topChallenge === challenge ? null : challenge,
    })
  }

  const atMaxSelections = data.selected.length >= MAX_SELECTIONS

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 >
          What is hardest about managing your health right now?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} (
          {data.selected.length}/{MAX_SELECTIONS} selected)
        </p>
      </div>

      <div
        className="flex flex-col gap-3"
        role="group"
        aria-label="Health challenges"
      >
        {CHALLENGE_OPTIONS.map(({ value, label }) => {
          const isSelected = data.selected.includes(value)
          const isDisabled = atMaxSelections && !isSelected
          return (
            <IntakeOption
              key={value}
              label={label}
              selected={isSelected}
              onToggle={() => toggleChallenge(value)}
              mode="checkbox"
              disabled={isDisabled}
            />
          )
        })}
      </div>

      {data.selected.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 >
            Which of these is your single biggest challenge?
          </h3>
          <div
            role="radiogroup"
            aria-label="Top challenge"
            className="flex flex-col gap-3"
          >
            {data.selected.map((value) => (
              <IntakeOption
                key={value}
                label={challengeLabel(value)}
                selected={data.topChallenge === value}
                onToggle={() => setTopChallenge(value)}
                mode="radio"
                value={value}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
