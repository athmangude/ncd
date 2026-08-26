import { useId } from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/Checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/Radio"

export interface IntakeOptionProps {
  label: string
  description?: string
  selected: boolean
  onToggle: () => void
  mode: "checkbox" | "radio"
  /** Required when mode is "radio" — the value passed to RadioGroupItem */
  value?: string
  className?: string
  disabled?: boolean
}

export default function IntakeOption({
  label,
  description,
  selected,
  onToggle,
  mode,
  value,
  className,
}: IntakeOptionProps) {
  const id = useId()
  const itemValue = value ?? label

  return (
    <div
      role={mode === "radio" ? "radio" : "checkbox"}
      tabIndex={0}
      aria-checked={selected}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-md border p-4 text-left transition-all",
        selected
          ? "border-primary bg-secondary"
          : "border-border hover:border-primary/40",
        className
      )}
    >
      <div className="mt-0.5 shrink-0">
        {mode === "checkbox" ? (
          <Checkbox
            id={id}
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
          />
        ) : (
          <RadioGroup
            value={selected ? itemValue : ""}
            onValueChange={onToggle}
          >
            <RadioGroupItem
              id={id}
              value={itemValue}
              onClick={(e) => e.stopPropagation()}
              aria-label={label}
            />
          </RadioGroup>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="font-sans text-sm font-medium">{label}</span>
        {description && (
          <span className="font-sans text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </div>
    </div>
  )
}
