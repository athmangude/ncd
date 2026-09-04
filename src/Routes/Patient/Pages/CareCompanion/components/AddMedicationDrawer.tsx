import { useState, useMemo, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import ConditionTypeahead from "../Intake/components/ConditionTypeahead"
import { Button } from "@/components/Button"
import { medicationCardsQueryKey } from "../hooks/useMedicationCards"
import { intakeProfileQueryKey } from "../hooks/useIntakeProfile"
import { refillScheduleQueryKey } from "../hooks/useRefillSchedule"
import { supabase } from "@/lib/supabase"
import {
  useMedicationTaxonomy,
  getMedicationPrice,
  type MedicationTaxonomyEntry,
} from "@/hooks/useMedicationTaxonomy"

interface MedicationEntry {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: string
  conditionTags: string[]
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

const REFILL_FREQUENCY_OPTIONS = [
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Every 30 days" },
  { value: 60, label: "Every 60 days" },
  { value: 90, label: "Every 90 days" },
]

const TEST_FREQUENCY_OPTIONS = [
  { value: 1, label: "Monthly" },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 12, label: "Yearly" },
]

interface ItemDetails {
  name: string
  category: string
  frequencyDays: number
  frequencyMonths: number
  cost: number
}

interface AddMedicationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingMedications: string[]
}

export function AddMedicationDrawer({
  open,
  onOpenChange,
  existingMedications,
}: AddMedicationDrawerProps) {
  const queryClient = useQueryClient()
  const { data: taxonomyData = [] } = useMedicationTaxonomy()
  const taxonomy = useMemo(
    () => taxonomyData.map(toMedicationEntry),
    [taxonomyData],
  )
  const [newMeds, setNewMeds] = useState<MedicationEntry[]>([])
  const [step, setStep] = useState<"select" | "details">("select")
  const [itemDetails, setItemDetails] = useState<ItemDetails[]>([])

  function nameToEntry(name: string): MedicationEntry {
    const found = taxonomy.find(
      (m) => m.genericName.toLowerCase() === name.toLowerCase(),
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

  const allSelected = useMemo(
    () => [
      ...existingMedications.map(nameToEntry),
      ...newMeds,
    ],
    [existingMedications, newMeds, taxonomy],
  )

  const handleSelect = useCallback(
    (med: MedicationEntry) => {
      if (
        !existingMedications.includes(med.genericName) &&
        !newMeds.some((m) => m.id === med.id)
      ) {
        setNewMeds((prev) => [...prev, med])
      }
    },
    [existingMedications, newMeds],
  )

  const handleRemove = useCallback(
    (medId: string) => {
      setNewMeds((prev) => prev.filter((m) => m.id !== medId))
    },
    [],
  )

  function goToDetails() {
    const details = newMeds.map((m) => {
      const isTest = m.category === "LAB_TEST"
      const defaultPrice = getMedicationPrice(taxonomyData, m.genericName)
      return {
        name: m.genericName,
        category: m.category,
        frequencyDays: 30,
        frequencyMonths: isTest ? 6 : 3,
        cost: defaultPrice,
      }
    })
    setItemDetails(details)
    setStep("details")
  }

  function updateDetail(
    index: number,
    field: keyof ItemDetails,
    value: number,
  ) {
    setItemDetails((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    )
  }

  const saveMedications = useMutation({
    mutationFn: async (payload: {
      medicationNames: string[]
      costEstimates: {
        medications: { name: string; refillFrequencyDays: number; estimatedCostPerRefill: number }[]
        tests: { name: string; frequencyMonths: number; estimatedCostPerTest: number }[]
      }
    }) => {
      const { error } = await supabase.from("profiles").update({
        treatment: {
          currentlyOnMedication: true,
          medicationNames: payload.medicationNames,
        },
        cost_estimates: payload.costEstimates,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [intakeProfileQueryKey],
      })
      queryClient.invalidateQueries({
        queryKey: ["careCompanionHome"],
      })
      queryClient.invalidateQueries({
        queryKey: [medicationCardsQueryKey],
      })
      queryClient.invalidateQueries({
        queryKey: [refillScheduleQueryKey],
      })
      setNewMeds([])
      setItemDetails([])
      setStep("select")
      onOpenChange(false)
    },
  })

  function handleSave() {
    const allMedNames = [
      ...existingMedications,
      ...itemDetails
        .filter((d) => d.category !== "LAB_TEST")
        .map((d) => d.name),
    ]

    const newMedCosts = itemDetails
      .filter((d) => d.category !== "LAB_TEST")
      .map((d) => ({
        name: d.name,
        refillFrequencyDays: d.frequencyDays,
        estimatedCostPerRefill: d.cost,
      }))

    const newTestCosts = itemDetails
      .filter((d) => d.category === "LAB_TEST")
      .map((d) => ({
        name: d.name,
        frequencyMonths: d.frequencyMonths,
        estimatedCostPerTest: d.cost,
      }))

    saveMedications.mutate({
      medicationNames: allMedNames,
      costEstimates: {
        medications: newMedCosts,
        tests: newTestCosts,
      },
    })
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setNewMeds([])
      setItemDetails([])
      setStep("select")
    }
    onOpenChange(isOpen)
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="min-h-[70dvh]">
        <DrawerHeader>
          {step === "details" && (
            <button
              type="button"
              onClick={() => setStep("select")}
              className="absolute left-4 top-4 flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <DrawerTitle>
            {step === "select" ? "Add medication or test" : "Set frequency & cost"}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          {step === "select" && (
            <>
              <ConditionTypeahead
                selectedMedications={allSelected}
                onSelect={handleSelect}
                onRemove={handleRemove}
                label="Search for medication or test"
                placeholder="Type a name..."
              />
              {newMeds.length > 0 && (
                <Button onClick={goToDetails}>
                  Next: Set frequency & cost
                </Button>
              )}
            </>
          )}

          {step === "details" && (
            <>
              <div className="space-y-4">
                {itemDetails.map((detail, i) => {
                  const isTest = detail.category === "LAB_TEST"
                  return (
                    <div
                      key={detail.name}
                      className="rounded-lg border bg-card p-3 space-y-3"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {detail.name}
                        {isTest && (
                          <span className="ml-2 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                            Test
                          </span>
                        )}
                      </p>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          {isTest ? "Test frequency" : "Refill frequency"}
                        </label>
                        <select
                          value={isTest ? detail.frequencyMonths : detail.frequencyDays}
                          onChange={(e) =>
                            updateDetail(
                              i,
                              isTest ? "frequencyMonths" : "frequencyDays",
                              Number(e.target.value),
                            )
                          }
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {(isTest ? TEST_FREQUENCY_OPTIONS : REFILL_FREQUENCY_OPTIONS).map(
                            (opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Estimated cost (KES)
                        </label>
                        <input
                          type="number"
                          value={detail.cost}
                          onChange={(e) =>
                            updateDetail(i, "cost", Number(e.target.value))
                          }
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm font-mono"
                          min={0}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                onClick={handleSave}
                disabled={saveMedications.isPending}
              >
                {saveMedications.isPending
                  ? "Saving..."
                  : `Save ${itemDetails.length} item${itemDetails.length > 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
