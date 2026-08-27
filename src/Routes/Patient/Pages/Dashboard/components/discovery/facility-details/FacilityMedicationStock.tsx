import { useQuery } from "@tanstack/react-query"
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntakeProfile } from "@/Routes/Patient/Pages/CareCompanion/hooks/useIntakeProfile"
import type { PharmacyStock, StockStatus } from "@/types/care-companion"

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  IN_STOCK: {
    label: "In stock",
    className: "text-emerald-700 bg-emerald-100",
    icon: CheckCircle2,
  },
  LOW_STOCK: {
    label: "Low stock",
    className: "text-amber-700 bg-amber-100",
    icon: AlertTriangle,
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    className: "text-red-700 bg-red-100",
    icon: XCircle,
  },
}

async function fetchFacilityStock(
  facilityId: string,
): Promise<PharmacyStock[]> {
  const res = await fetch(
    `/care-companion/pharmacy-stock/facility/${facilityId}`,
  )
  if (!res.ok) return []
  return res.json()
}

interface FacilityMedicationStockProps {
  facilityId: string
}

export function FacilityMedicationStock({
  facilityId,
}: FacilityMedicationStockProps) {
  const { data: profile } = useIntakeProfile()
  const hasMeds = (profile?.treatment?.medicationNames?.length ?? 0) > 0

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ["care-companion", "pharmacy-stock", "facility", facilityId],
    queryFn: () => fetchFacilityStock(facilityId),
    enabled: hasMeds,
    staleTime: 5 * 60 * 1000,
  })

  if (!hasMeds) return null

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Checking medication availability...
        </span>
      </div>
    )
  }

  const medications = profile?.treatment?.medicationNames ?? []
  const stockMap = new Map(stock.map((s) => [s.medicationName, s]))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Pill className="h-4 w-4 text-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Your medication availability
        </h3>
      </div>

      <div className="space-y-2">
        {medications.map((med) => {
          const entry = stockMap.get(med)
          return (
            <MedicationRow
              key={med}
              name={med}
              status={entry?.status ?? null}
            />
          )
        })}
      </div>
    </div>
  )
}

function MedicationRow({
  name,
  status,
}: {
  name: string
  status: StockStatus | null
}) {
  if (!status) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
        <span className="text-sm text-foreground">{name}</span>
        <span className="text-xs text-muted-foreground italic">
          Not carried
        </span>
      </div>
    )
  }

  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
      <span className="text-sm text-foreground">{name}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
          config.className,
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    </div>
  )
}
