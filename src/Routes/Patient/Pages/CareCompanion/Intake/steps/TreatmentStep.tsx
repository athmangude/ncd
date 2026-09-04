import { useState, useMemo, useCallback } from "react"
import { Plus } from "lucide-react"
import { Label } from "@/components/Label"
import { Textarea } from "@/components/Textarea"
import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import FormGroupWrapper from "@/components/form/FormGroupWrapper"
import IntakeOption from "../components/IntakeOption"
import {
  useMedicationTaxonomy,
  type MedicationTaxonomyEntry,
} from "@/hooks/useMedicationTaxonomy"
import type { CareCompanionProfile } from "@/types/care-companion"

type TreatmentData = CareCompanionProfile["treatment"]
type ConditionValue = CareCompanionProfile["conditions"]["type"][number]
type Regularity = NonNullable<TreatmentData["takingMedicationRegularly"]>
type MissingReason = TreatmentData["reasonsForMissing"][number]

interface MedicationEntry {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: string
  conditionTags: string[]
}

interface TreatmentStepProps {
  data: TreatmentData
  conditions: ConditionValue[]
  onUpdate: (data: TreatmentData) => void
}

function toMedicationEntry(row: MedicationTaxonomyEntry): MedicationEntry {
  return {
    id: row.id,
    genericName: row.genericName,
    brandNames: row.brandNames,
    strengths: row.strengths,
    category: row.category,
    conditionTags: row.conditionTags,
  }
}

const CONDITION_LABELS: Record<string, string> = {
  DIABETES: "Diabetes",
  HYPERTENSION: "High Blood Pressure",
  ASTHMA: "Asthma",
  CANCER: "Cancer",
  KIDNEY_DISEASE: "Kidney Disease",
  HEART_DISEASE: "Heart Disease",
  SICKLE_CELL: "Sickle Cell Disease",
  HIV_AIDS: "HIV/AIDS",
  EPILEPSY: "Epilepsy",
  COPD: "Chronic Lung Disease (COPD)",
  ARTHRITIS: "Arthritis",
  MENTAL_HEALTH: "Mental Health",
  THYROID: "Thyroid Disorder",
  STROKE: "Stroke",
  LIVER_DISEASE: "Liver Disease",
  OTHER: "Other",
}

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

export default function TreatmentStep({
  data,
  conditions,
  onUpdate,
}: TreatmentStepProps) {
  const { data: taxonomyData = [] } = useMedicationTaxonomy()
  const taxonomy = useMemo(
    () => taxonomyData.map(toMedicationEntry),
    [taxonomyData],
  )

  const [localOnMedication, setLocalOnMedication] = useState<boolean | null>(
    data.currentlyOnMedication === false &&
      data.medicationNames.length === 0
      ? null
      : data.currentlyOnMedication,
  )
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [customMedName, setCustomMedName] = useState("")

  const allGenericNames = useMemo(
    () => new Set(taxonomy.map((m) => m.genericName)),
    [taxonomy],
  )

  const customMedications = useMemo(
    () => data.medicationNames.filter((n) => !allGenericNames.has(n)),
    [data.medicationNames, allGenericNames],
  )

  const medicationsByCondition = useMemo(() => {
    const medsOnly = taxonomy.filter((m) => m.category === "MEDICATION")
    const assigned = new Set<string>()
    const groups: { condition: string; medications: MedicationEntry[] }[] = []

    for (const condition of conditions) {
      if (condition === "OTHER") continue
      const meds = medsOnly.filter(
        (m) =>
          !assigned.has(m.id) &&
          m.conditionTags.includes(condition),
      )
      if (meds.length > 0) {
        meds.forEach((m) => assigned.add(m.id))
        groups.push({
          condition,
          medications: meds.sort((a, b) =>
            a.genericName.localeCompare(b.genericName),
          ),
        })
      }
    }

    return groups
  }, [conditions])

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
    [data, onUpdate],
  )

  const toggleMedication = useCallback(
    (genericName: string) => {
      const current = data.medicationNames
      const updated = current.includes(genericName)
        ? current.filter((n) => n !== genericName)
        : [...current, genericName]
      onUpdate({ ...data, medicationNames: updated })
    },
    [data, onUpdate],
  )

  function addCustomMedication() {
    const trimmed = customMedName.trim()
    if (!trimmed || data.medicationNames.includes(trimmed)) return
    onUpdate({
      ...data,
      medicationNames: [...data.medicationNames, trimmed],
    })
    setCustomMedName("")
  }

  function removeCustomMedication(name: string) {
    onUpdate({
      ...data,
      medicationNames: data.medicationNames.filter((n) => n !== name),
    })
  }

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
        <h2>Your current treatment</h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your medications and treatment
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3>
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

      {showMedicationSubQuestions && (
        <>
          <div className="flex flex-col gap-4">
            <h3>Which medications are you taking?</h3>
            <p className="text-sm text-muted-foreground">
              Select all that apply
            </p>
            {medicationsByCondition.map(({ condition, medications }) => (
              <div key={condition} className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {CONDITION_LABELS[condition] ?? condition}
                </p>
                <div className="flex flex-col gap-2">
                  {medications.map((med) => (
                    <IntakeOption
                      key={med.id}
                      label={med.genericName}
                      description={
                        med.brandNames.length > 0
                          ? med.brandNames.join(", ")
                          : undefined
                      }
                      selected={data.medicationNames.includes(
                        med.genericName,
                      )}
                      onToggle={() => toggleMedication(med.genericName)}
                      mode="checkbox"
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <IntakeOption
                label="Other"
                description="Add a medication not listed above"
                selected={showOtherInput || customMedications.length > 0}
                onToggle={() => setShowOtherInput((v) => !v)}
                mode="checkbox"
              />

              {(showOtherInput || customMedications.length > 0) && (
                <div className="ml-2 flex flex-col gap-3 border-l-2 border-muted pl-4">
                  {customMedications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customMedications.map((name) => (
                        <Chip
                          key={name}
                          onRemove={() => removeCustomMedication(name)}
                          removeLabel={`Remove ${name}`}
                        >
                          {name}
                        </Chip>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customMedName}
                      onChange={(e) => setCustomMedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCustomMedication()
                        }
                      }}
                      placeholder="Type medication name..."
                      className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sensitive-data"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addCustomMedication}
                      disabled={!customMedName.trim()}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3>How regularly do you take your medication?</h3>
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

          {showReasonsForMissing && (
            <div className="flex flex-col gap-3">
              <h3>
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

      <div className="flex flex-col gap-3">
        <h3>
          Do you use any herbal or traditional remedies for your
          condition?
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
