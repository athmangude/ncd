import { Label } from "@/components/Label"
import { Textarea } from "@/components/Textarea"
import FormGroupWrapper from "@/components/form/FormGroupWrapper"
import IntakeOption from "../components/IntakeOption"
import type { CareCompanionProfile } from "@/types/care-companion"

type ConditionsData = CareCompanionProfile["conditions"]
type ConditionValue = ConditionsData["type"][number]
type DiagnosisRecency = NonNullable<ConditionsData["diagnosisRecency"]>

interface ConditionsStepProps {
  data: ConditionsData
  onUpdate: (data: ConditionsData) => void
}

const CONDITION_OPTIONS: { value: ConditionValue; label: string }[] = [
  { value: "DIABETES", label: "Diabetes" },
  { value: "HYPERTENSION", label: "High Blood Pressure (Hypertension)" },
  { value: "ASTHMA", label: "Asthma" },
  { value: "CANCER", label: "Cancer" },
  { value: "KIDNEY_DISEASE", label: "Kidney Disease" },
  { value: "HEART_DISEASE", label: "Heart Disease" },
  { value: "SICKLE_CELL", label: "Sickle Cell Disease" },
  { value: "OTHER", label: "Other" },
]

const DIAGNOSIS_RECENCY_OPTIONS: {
  value: DiagnosisRecency
  label: string
}[] = [
  { value: "LESS_THAN_6_MONTHS", label: "Less than 6 months" },
  { value: "6_MONTHS_TO_2_YEARS", label: "6 months to 2 years" },
  { value: "MORE_THAN_2_YEARS", label: "More than 2 years" },
]

export default function ConditionsStep({
  data,
  onUpdate,
}: ConditionsStepProps) {
  function toggleCondition(condition: ConditionValue) {
    const current = data.type
    const updated = current.includes(condition)
      ? current.filter((c) => c !== condition)
      : [...current, condition]

    onUpdate({
      ...data,
      type: updated,
      otherDescription: updated.includes("OTHER")
        ? data.otherDescription
        : null,
      diagnosisRecency: updated.length > 0 ? data.diagnosisRecency : null,
    })
  }

  function setDiagnosisRecency(value: DiagnosisRecency) {
    onUpdate({
      ...data,
      diagnosisRecency: data.diagnosisRecency === value ? null : value,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2>Which health condition(s) are you managing?</h2>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
      </div>

      <div
        className="flex flex-col gap-3"
        role="group"
        aria-label="Health conditions"
      >
        {CONDITION_OPTIONS.map(({ value, label }) => (
          <IntakeOption
            key={value}
            label={label}
            selected={data.type.includes(value)}
            onToggle={() => toggleCondition(value)}
            mode="checkbox"
          />
        ))}
      </div>

      {data.type.includes("OTHER") && (
        <FormGroupWrapper>
          <Label htmlFor="other-condition-description">
            Please describe your condition
          </Label>
          <Textarea
            id="other-condition-description"
            value={data.otherDescription ?? ""}
            onChange={(e) =>
              onUpdate({
                ...data,
                otherDescription: e.target.value || null,
              })
            }
            placeholder="Describe your condition..."
            rows={3}
            maxLength={200}
            className="sensitive-data"
          />
        </FormGroupWrapper>
      )}

      {data.type.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3>How long ago were you diagnosed?</h3>
          <div
            role="radiogroup"
            aria-label="Diagnosis recency"
            className="flex flex-col gap-3"
          >
            {DIAGNOSIS_RECENCY_OPTIONS.map(({ value, label }) => (
              <IntakeOption
                key={value}
                label={label}
                selected={data.diagnosisRecency === value}
                onToggle={() => setDiagnosisRecency(value)}
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
