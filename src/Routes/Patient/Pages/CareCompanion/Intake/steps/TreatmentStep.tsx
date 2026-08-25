import { useState, useMemo, useCallback } from "react"
import { Label } from "@/components/Label"
import { Textarea } from "@/components/Textarea"
import FormGroupWrapper from "@/components/form/FormGroupWrapper"
import IntakeOption from "../components/IntakeOption"
import ConditionTypeahead from "../components/ConditionTypeahead"
import medicationTaxonomy from "@/mocks/fixtures/medication-taxonomy.json"
import type { CareCompanionProfile } from "@/types/care-companion"

type TreatmentData = CareCompanionProfile["treatment"]
type Regularity = NonNullable<TreatmentData["takingMedicationRegularly"]>
type MissingReason = TreatmentData["reasonsForMissing"][number]

interface TreatmentStepProps {
  data: TreatmentData
  onUpdate: (data: TreatmentData) => void
}

interface MedicationEntry {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: string
  conditionTags: string[]
}

const taxonomy = medicationTaxonomy as MedicationEntry[]

const REGULARITY_OPTIONS: { value: Regularity; label: string }[] = [
  { value: "ALWAYS", label: "Always" },
  { value: "MOSTLY", label: "Mostly" },
  { value: "SOMETIMES", label: "Sometimes" },
  { value: "RARELY", label: "Rarely" },
]

const REASONS_FOR_MISSING_OPTIONS: {
  value: MissingReason
  label: string
}[] = [
  { value: "COST", label: "Too expensive" },
  { value: "FORGOT", label: "I forget" },
  { value: "SIDE_EFFECTS", label: "Side effects bother me" },
  { value: "FEEL_FINE", label: "I feel fine without it" },
  { value: "STOCK_OUT", label: "Pharmacy runs out" },
  { value: "OTHER", label: "Other" },
]

function nameToEntry(name: string): MedicationEntry {
  const found = taxonomy.find(
    (m) => m.genericName.toLowerCase() === name.toLowerCase()
  )
  if (found) return found
  return {
    id: `custom-${name.toLowerCase().replace(/\s+/g, "-")}`,
    genericName: name,
    brandNames: [],
    strengths: [],
    category: "MEDICATION",
    conditionTags: [],
  }
}

export default function TreatmentStep({
  data,
  onUpdate,
}: TreatmentStepProps) {
  const selectedMedEntries = useMemo(
    () => data.medicationNames.map(nameToEntry),
    [data.medicationNames]
  )

  const [localOnMedication, setLocalOnMedication] = useState<boolean | null>(
    data.currentlyOnMedication === false &&
      data.medicationNames.length === 0
      ? null
      : data.currentlyOnMedication
  )

  const handleMedicationToggle = useCallback(
    (value: boolean) => {
      setLocalOnMedication(value)
      if (value) {
        onUpdate({ ...data, currentlyOnMedication: true })
      } else {
        onUpdate({
          ...data,
          currentlyOnMedication: false,
          medicationNames: [],
          takingMedicationRegularly: null,
          reasonsForMissing: [],
        })
      }
    },
    [data, onUpdate]
  )

  const handleSelectMedication = useCallback(
    (med: MedicationEntry) => {
      if (!data.medicationNames.includes(med.genericName)) {
        onUpdate({
          ...data,
          medicationNames: [...data.medicationNames, med.genericName],
        })
      }
    },
    [data, onUpdate]
  )

  const handleRemoveMedication = useCallback(
    (medId: string) => {
      const entry = selectedMedEntries.find((m) => m.id === medId)
      if (!entry) return
      onUpdate({
        ...data,
        medicationNames: data.medicationNames.filter(
          (n) => n !== entry.genericName
        ),
      })
    },
    [data, selectedMedEntries, onUpdate]
  )

  function setRegularity(value: Regularity) {
    const showReasons = value === "SOMETIMES" || value === "RARELY"
    onUpdate({
      ...data,
      takingMedicationRegularly: value,
      reasonsForMissing: showReasons ? data.reasonsForMissing : [],
    })
  }

  function toggleMissingReason(reason: MissingReason) {
    const current = data.reasonsForMissing
    const updated = current.includes(reason)
      ? current.filter((r) => r !== reason)
      : [...current, reason]
    onUpdate({ ...data, reasonsForMissing: updated })
  }

  function setHerbal(value: boolean) {
    onUpdate({
      ...data,
      usingHerbalAlternatives: value,
      herbalDetails: value ? data.herbalDetails : null,
    })
  }

  const showMedicationSubQuestions = data.currentlyOnMedication === true
  const showReasonsForMissing =
    data.takingMedicationRegularly === "SOMETIMES" ||
    data.takingMedicationRegularly === "RARELY"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 >
          Your current treatment
        </h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your medications and treatment
        </p>
      </div>

      {/* Medication yes/no */}
      <div className="flex flex-col gap-3">
        <h3 >
          Are you currently taking any medication for your condition?
        </h3>
        <div
          role="radiogroup"
          aria-label="Currently on medication"
          className="flex flex-col gap-3"
        >
          <IntakeOption
            label="Yes"
            selected={localOnMedication === true}
            onToggle={() => handleMedicationToggle(true)}
            mode="radio"
            value="yes"
          />
          <IntakeOption
            label="No"
            selected={localOnMedication === false}
            onToggle={() => handleMedicationToggle(false)}
            mode="radio"
            value="no"
          />
        </div>
      </div>

      {/* Conditional medication sub-questions */}
      {showMedicationSubQuestions && (
        <>
          {/* Medication typeahead */}
          <ConditionTypeahead
            selectedMedications={selectedMedEntries}
            onSelect={handleSelectMedication}
            onRemove={handleRemoveMedication}
            label="What medications are you taking?"
            placeholder="Type a medication name..."
          />

          {/* Regularity */}
          <div className="flex flex-col gap-3">
            <h3 >
              How regularly do you take your medication?
            </h3>
            <div
              role="radiogroup"
              aria-label="Medication regularity"
              className="flex flex-col gap-3"
            >
              {REGULARITY_OPTIONS.map(({ value, label }) => (
                <IntakeOption
                  key={value}
                  label={label}
                  selected={data.takingMedicationRegularly === value}
                  onToggle={() => setRegularity(value)}
                  mode="radio"
                  value={value}
                />
              ))}
            </div>
          </div>

          {/* Conditional reasons for missing */}
          {showReasonsForMissing && (
            <div className="flex flex-col gap-3">
              <h3 >
                What makes it hard to take your medication regularly?
              </h3>
              <div
                role="group"
                aria-label="Reasons for missing medication"
                className="flex flex-col gap-3"
              >
                {REASONS_FOR_MISSING_OPTIONS.map(({ value, label }) => (
                  <IntakeOption
                    key={value}
                    label={label}
                    selected={data.reasonsForMissing.includes(value)}
                    onToggle={() => toggleMissingReason(value)}
                    mode="checkbox"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Herbal alternatives */}
      <div className="flex flex-col gap-3">
        <h3 >
          Do you use any herbal or traditional remedies for your condition?
        </h3>
        <div
          role="radiogroup"
          aria-label="Using herbal alternatives"
          className="flex flex-col gap-3"
        >
          <IntakeOption
            label="Yes"
            selected={data.usingHerbalAlternatives === true}
            onToggle={() => setHerbal(true)}
            mode="radio"
            value="herbal-yes"
          />
          <IntakeOption
            label="No"
            selected={data.usingHerbalAlternatives === false}
            onToggle={() => setHerbal(false)}
            mode="radio"
            value="herbal-no"
          />
        </div>
      </div>

      {data.usingHerbalAlternatives && (
        <FormGroupWrapper>
          <Label htmlFor="herbal-details">What do you use?</Label>
          <Textarea
            id="herbal-details"
            value={data.herbalDetails ?? ""}
            onChange={(e) =>
              onUpdate({
                ...data,
                herbalDetails: e.target.value || null,
              })
            }
            placeholder="Describe the herbal or traditional remedies you use..."
            rows={3}
            maxLength={300}
            className="sensitive-data"
          />
        </FormGroupWrapper>
      )}
    </div>
  )
}
