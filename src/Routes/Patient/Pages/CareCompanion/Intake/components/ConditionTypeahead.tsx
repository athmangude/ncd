import { useState, useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Chip } from "@/components/Chip"
import FormGroupInput from "@/components/form/FormGroupInput"
import medicationTaxonomy from "@/mocks/fixtures/medication-taxonomy.json"

interface MedicationEntry {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: string
  conditionTags: string[]
}

interface ConditionTypeaheadProps {
  selectedMedications: MedicationEntry[]
  onSelect: (medication: MedicationEntry) => void
  onRemove: (medicationId: string) => void
  label?: string
  placeholder?: string
  className?: string
}

const taxonomy = medicationTaxonomy as MedicationEntry[]

export default function ConditionTypeahead({
  selectedMedications,
  onSelect,
  onRemove,
  label = "Search medications",
  placeholder = "Type a medication name...",
  className,
}: ConditionTypeaheadProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedIds = useMemo(
    () => new Set(selectedMedications.map((m) => m.id)),
    [selectedMedications]
  )

  const filteredResults = useMemo(() => {
    if (query.trim().length === 0) return []

    const normalised = query.trim().toLowerCase()

    return taxonomy.filter(
      (med) =>
        !selectedIds.has(med.id) &&
        (med.genericName.toLowerCase().includes(normalised) ||
          med.brandNames.some((b) => b.toLowerCase().includes(normalised)))
    )
  }, [query, selectedIds])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(medication: MedicationEntry) {
    onSelect(medication)
    setQuery("")
    setIsOpen(false)
  }

  const showDropdown = isOpen && query.trim().length > 0

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-3", className)}>
      <div className="relative">
        <FormGroupInput
          id="condition-typeahead"
          label={label}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onBlur={() => {
            // Delay closing so click on dropdown can fire
            setTimeout(() => setIsOpen(false), 200)
          }}
          error={undefined}
        />

        {showDropdown && (
          <div
            role="listbox"
            aria-label="Medication search results"
            className={cn(
              "absolute top-full left-0 z-10 mt-1 w-full overflow-y-auto rounded-md border border-border bg-background shadow-md",
              "max-h-48"
            )}
          >
            {filteredResults.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No medications found
              </div>
            ) : (
              filteredResults.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(med)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors",
                    "hover:bg-accent focus:bg-accent focus:outline-none"
                  )}
                >
                  <span className="font-sans text-sm font-medium">
                    {med.genericName}
                  </span>
                  {med.brandNames.length > 0 && (
                    <span className="font-sans text-xs text-muted-foreground">
                      {med.brandNames.join(", ")}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedMedications.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Selected medications">
          {selectedMedications.map((med) => (
            <Chip
              key={med.id}
              variant="secondary"
              onRemove={() => onRemove(med.id)}
              removeLabel={`Remove ${med.genericName}`}
            >
              {med.genericName}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
