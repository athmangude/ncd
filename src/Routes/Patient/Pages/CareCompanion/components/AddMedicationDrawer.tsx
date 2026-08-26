import { useState, useMemo, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
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
import medicationTaxonomy from "@/mocks/fixtures/medication-taxonomy.json"

interface MedicationEntry {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: string
  conditionTags: string[]
}

const taxonomy = medicationTaxonomy as MedicationEntry[]

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
  const [newMeds, setNewMeds] = useState<MedicationEntry[]>([])

  const allSelected = useMemo(
    () => [
      ...existingMedications.map(nameToEntry),
      ...newMeds,
    ],
    [existingMedications, newMeds],
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

  const saveMedications = useMutation({
    mutationFn: async (medicationNames: string[]) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/profile`,
        {
          treatment: {
            currentlyOnMedication: true,
            medicationNames,
          },
        },
      )
      return response.data
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
      setNewMeds([])
      onOpenChange(false)
    },
  })

  function handleSave() {
    const allNames = [
      ...existingMedications,
      ...newMeds.map((m) => m.genericName),
    ]
    saveMedications.mutate(allNames)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="min-h-[70dvh]">
        <DrawerHeader>
          <DrawerTitle>Add medication</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <ConditionTypeahead
            selectedMedications={allSelected}
            onSelect={handleSelect}
            onRemove={handleRemove}
            label="Search for your medication"
            placeholder="Type a medication name..."
          />
          {newMeds.length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saveMedications.isPending}
            >
              {saveMedications.isPending
                ? "Saving..."
                : `Add ${newMeds.length} medication${newMeds.length > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
