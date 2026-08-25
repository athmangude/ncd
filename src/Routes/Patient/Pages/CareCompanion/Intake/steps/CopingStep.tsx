import IntakeOption from "../components/IntakeOption"
import type { CareCompanionProfile } from "@/types/care-companion"

type CopingData = CareCompanionProfile["coping"]
type ChallengeValue = CareCompanionProfile["challenges"]["selected"][number]
type CostCopingValue = NonNullable<CopingData["costCoping"]>[number]
type InfoSourceValue = CopingData["informationSources"][number]
type ExerciseFrequency = NonNullable<CopingData["exerciseFrequency"]>

interface CopingStepProps {
  data: CopingData
  challenges: ChallengeValue[]
  onUpdate: (data: CopingData) => void
}

const COST_COPING_OPTIONS: { value: CostCopingValue; label: string }[] = [
  { value: "BORROW_FAMILY", label: "Borrow from family" },
  { value: "SKIP_DOSES", label: "Skip doses or reduce dosage" },
  { value: "CHEAPER_ALTERNATIVES", label: "Switch to cheaper alternatives" },
  { value: "SELL_ASSETS", label: "Sell something" },
  { value: "FUNDRAISE", label: "Fundraise from friends" },
  { value: "NOTHING", label: "Nothing, I just go without" },
  { value: "OTHER", label: "Other" },
]

const INFO_SOURCE_OPTIONS: { value: InfoSourceValue; label: string }[] = [
  { value: "DOCTOR", label: "My doctor" },
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "WHATSAPP", label: "WhatsApp groups" },
  { value: "INTERNET", label: "Internet search" },
  { value: "FAMILY", label: "Family and friends" },
  { value: "CHP", label: "Community health promoter" },
  { value: "TRADITIONAL_HEALER", label: "Traditional healer" },
  { value: "NONE", label: "I don't really get information" },
]

const EXERCISE_FREQUENCY_OPTIONS: {
  value: ExerciseFrequency
  label: string
}[] = [
  { value: "DAILY", label: "Daily" },
  { value: "FEW_TIMES_WEEK", label: "A few times a week" },
  { value: "RARELY", label: "Rarely" },
  { value: "NEVER", label: "Never" },
]

export default function CopingStep({
  data,
  challenges,
  onUpdate,
}: CopingStepProps) {
  const showCostCoping = challenges.includes("COST")
  const showEmergencyPlan = challenges.includes("EMERGENCY_PREPAREDNESS")
  const showExerciseFrequency = challenges.includes("EXERCISE")

  function toggleCostCoping(value: CostCopingValue) {
    const current = data.costCoping ?? []
    const updated = current.includes(value)
      ? current.filter((c) => c !== value)
      : [...current, value]
    onUpdate({ ...data, costCoping: updated })
  }

  function toggleInfoSource(value: InfoSourceValue) {
    const current = data.informationSources
    const updated = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value]
    onUpdate({ ...data, informationSources: updated })
  }

  function setEmergencyPlan(value: boolean) {
    onUpdate({ ...data, hasEmergencyPlan: value })
  }

  function setExerciseFrequency(value: ExerciseFrequency) {
    onUpdate({
      ...data,
      exerciseFrequency:
        data.exerciseFrequency === value ? null : value,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 >
          How you currently cope
        </h2>
        <p className="text-sm text-muted-foreground">
          Help us understand how you manage your health today
        </p>
      </div>

      {/* Cost coping: only if COST was selected in challenges */}
      {showCostCoping && (
        <div className="flex flex-col gap-3">
          <h3 >
            When you can&apos;t afford your medication, what do you do?
          </h3>
          <div
            role="group"
            aria-label="Cost coping strategies"
            className="flex flex-col gap-3"
          >
            {COST_COPING_OPTIONS.map(({ value, label }) => (
              <IntakeOption
                key={value}
                label={label}
                selected={(data.costCoping ?? []).includes(value)}
                onToggle={() => toggleCostCoping(value)}
                mode="checkbox"
              />
            ))}
          </div>
        </div>
      )}

      {/* Information sources: always shown */}
      <div className="flex flex-col gap-3">
        <h3 >
          Where do you get health information about your condition?
        </h3>
        <div
          role="group"
          aria-label="Information sources"
          className="flex flex-col gap-3"
        >
          {INFO_SOURCE_OPTIONS.map(({ value, label }) => (
            <IntakeOption
              key={value}
              label={label}
              selected={data.informationSources.includes(value)}
              onToggle={() => toggleInfoSource(value)}
              mode="checkbox"
            />
          ))}
        </div>
      </div>

      {/* Emergency plan: only if EMERGENCY_PREPAREDNESS was selected */}
      {showEmergencyPlan && (
        <div className="flex flex-col gap-3">
          <h3 >
            Do you have a plan for what to do if you have a health emergency?
          </h3>
          <div
            role="radiogroup"
            aria-label="Emergency plan"
            className="flex flex-col gap-3"
          >
            <IntakeOption
              label="Yes"
              selected={data.hasEmergencyPlan === true}
              onToggle={() => setEmergencyPlan(true)}
              mode="radio"
              value="emergency-yes"
            />
            <IntakeOption
              label="No"
              selected={data.hasEmergencyPlan === false}
              onToggle={() => setEmergencyPlan(false)}
              mode="radio"
              value="emergency-no"
            />
          </div>
        </div>
      )}

      {/* Exercise frequency: only if EXERCISE was selected */}
      {showExerciseFrequency && (
        <div className="flex flex-col gap-3">
          <h3 >
            How often do you exercise?
          </h3>
          <div
            role="radiogroup"
            aria-label="Exercise frequency"
            className="flex flex-col gap-3"
          >
            {EXERCISE_FREQUENCY_OPTIONS.map(({ value, label }) => (
              <IntakeOption
                key={value}
                label={label}
                selected={data.exerciseFrequency === value}
                onToggle={() => setExerciseFrequency(value)}
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
