import { useMemo, useState } from "react"
import {
  Pill,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Car,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionTitle } from "@/components/SectionTitle"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import type { MedicationStockSummary } from "./useMyMedicationStock"
import type { PharmacyStock, StockStatus } from "@/types/care-companion"

interface MedicationStockSectionProps {
  summaries: MedicationStockSummary[]
  selectedMedication: string | null
  onSelectMedication: (med: string | null) => void
  userLocation?: { lat: number; lng: number } | null
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

const AVG_SPEED_KMH = 28
const ROAD_INFLATE = 1.3

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
  return 2 * R * Math.asin(Math.sqrt(a))
}

function getDriveInfo(
  entry: PharmacyStock,
  userLocation: { lat: number; lng: number } | null | undefined,
) {
  if (!userLocation || !entry.lat || !entry.lng) return null
  const straightKm = haversineKm(
    userLocation.lat,
    userLocation.lng,
    entry.lat,
    entry.lng,
  )
  const roadKm = straightKm * ROAD_INFLATE
  const driveMinutes = Math.max(1, Math.round((roadKm / AVG_SPEED_KMH) * 60))
  return { distanceKm: roadKm, driveMinutes }
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function formatDriveTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatPrice(price: number | undefined) {
  if (price == null) return null
  if (price === 0) return "Free"
  return `KES ${price.toLocaleString()}`
}

export function MedicationStockSection({
  summaries,
  selectedMedication,
  onSelectMedication,
  userLocation,
}: MedicationStockSectionProps) {
  const [drawerMed, setDrawerMed] = useState<MedicationStockSummary | null>(
    null,
  )

  const sortedEntries = useMemo(() => {
    if (!drawerMed) return []
    return [...drawerMed.entries].sort((a, b) => {
      const da = getDriveInfo(a, userLocation)
      const db = getDriveInfo(b, userLocation)
      return (da?.distanceKm ?? Infinity) - (db?.distanceKm ?? Infinity)
    })
  }, [drawerMed, userLocation])

  if (summaries.length === 0) return null

  return (
    <>
      <div className="flex flex-col w-full">
        <div className="flex items-center gap-2 py-1.5 w-full">
          <span className="text-foreground">
            <Pill className="h-4 w-4" />
          </span>
          <SectionTitle className="flex-1">Your medications & tests nearby</SectionTitle>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {summaries.map((s) => (
            <button
              key={s.medicationName}
              type="button"
              onClick={() => {
                setDrawerMed(s)
                onSelectMedication(s.medicationName)
              }}
              className={cn(
                "shrink-0 rounded-xl border p-3 transition-all text-left",
                summaries.length === 1 ? "w-full" : "w-[220px]",
                selectedMedication === s.medicationName
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card",
              )}
            >
              <p className="text-sm font-medium text-foreground leading-tight line-clamp-1">
                {s.medicationName}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
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
          ))}
        </div>
      </div>

      <Drawer
        open={drawerMed !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDrawerMed(null)
            onSelectMedication(null)
          }
        }}
      >
        <DrawerContent className="max-h-[85dvh]">
          {drawerMed && (
            <>
              <DrawerHeader className="pb-2">
                <DrawerTitle className="text-base">
                  {drawerMed.medicationName}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
                  Available at {drawerMed.totalFacilities}{" "}
                  {drawerMed.totalFacilities === 1 ? "facility" : "facilities"}{" "}
                  near you
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-6 space-y-2 overflow-y-auto">
                {sortedEntries.map((entry) => (
                  <FacilityRow
                    key={`${entry.facilityId}-${entry.medicationName}`}
                    entry={entry}
                    userLocation={userLocation}
                  />
                ))}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

function FacilityRow({
  entry,
  userLocation,
}: {
  entry: PharmacyStock
  userLocation?: { lat: number; lng: number } | null
}) {
  const config = STATUS_CONFIG[entry.status]
  const Icon = config.icon
  const price = formatPrice(entry.priceKES)
  const drive = getDriveInfo(entry, userLocation)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <MapPin className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {entry.facilityName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              config.className,
            )}
          >
            <Icon className="h-2.5 w-2.5" />
            {config.label}
          </span>
          {drive && (
            <>
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Car className="h-2.5 w-2.5" />
                {formatDriveTime(drive.driveMinutes)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatDistance(drive.distanceKm)}
              </span>
            </>
          )}
        </div>
      </div>

      {price && (
        <span className="shrink-0 text-sm font-semibold text-foreground font-mono tabular-nums">
          {price}
        </span>
      )}
    </div>
  )
}
