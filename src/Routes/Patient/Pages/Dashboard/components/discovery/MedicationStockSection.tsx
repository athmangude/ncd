import { useState } from "react"
import { Pill, MapPin, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionTitle } from "@/components/SectionTitle"
import type { MedicationStockSummary } from "./useMyMedicationStock"
import type { PharmacyStock, StockStatus } from "@/types/care-companion"

interface MedicationStockSectionProps {
  summaries: MedicationStockSummary[]
  selectedMedication: string | null
  onSelectMedication: (med: string | null) => void
}

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  IN_STOCK: {
    label: "In stock",
    className: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  LOW_STOCK: {
    label: "Low stock",
    className: "bg-amber-100 text-amber-700",
    icon: AlertTriangle,
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
}

export function MedicationStockSection({
  summaries,
  selectedMedication,
  onSelectMedication,
}: MedicationStockSectionProps) {
  const [expandedMed, setExpandedMed] = useState<string | null>(null)

  if (summaries.length === 0) return null

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 py-1.5 w-full">
        <span className="text-foreground">
          <Pill className="h-4 w-4" />
        </span>
        <SectionTitle className="flex-1">Your medications nearby</SectionTitle>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {summaries.map((s) => {
          const isSelected = selectedMedication === s.medicationName
          const isExpanded = expandedMed === s.medicationName

          return (
            <div
              key={s.medicationName}
              className={cn(
                "shrink-0 rounded-xl border p-3 transition-all",
                summaries.length === 1 ? "w-full" : "w-[220px]",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onSelectMedication(null)
                  } else {
                    onSelectMedication(s.medicationName)
                  }
                }}
                className="flex flex-col gap-1.5 w-full text-left"
              >
                <p className="text-sm font-medium text-foreground leading-tight line-clamp-1">
                  {s.medicationName}
                </p>
                <div className="flex items-center gap-1.5">
                  {s.inStockCount > 0 ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">
                        In stock at {s.inStockCount}{" "}
                        {s.inStockCount === 1 ? "facility" : "facilities"}
                      </span>
                    </>
                  ) : s.lowStockCount > 0 ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs text-amber-700 font-medium">
                        Low stock at {s.lowStockCount}{" "}
                        {s.lowStockCount === 1 ? "facility" : "facilities"}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-xs text-red-600 font-medium">
                        Out of stock nearby
                      </span>
                    </>
                  )}
                </div>
              </button>

              {isSelected && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedMed(isExpanded ? null : s.medicationName)
                  }
                  className="mt-2 text-[11px] text-primary font-medium"
                >
                  {isExpanded ? "Hide details" : "Show facilities"}
                </button>
              )}

              {isSelected && isExpanded && (
                <div className="mt-2 space-y-1.5">
                  {s.entries.map((entry) => (
                    <FacilityStockRow
                      key={`${entry.facilityId}-${entry.medicationName}`}
                      entry={entry}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FacilityStockRow({ entry }: { entry: PharmacyStock }) {
  const config = STATUS_CONFIG[entry.status]
  const Icon = config.icon

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-foreground truncate">
          {entry.facilityName}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
          config.className,
        )}
      >
        <Icon className="h-2.5 w-2.5" />
        {config.label}
      </span>
    </div>
  )
}
