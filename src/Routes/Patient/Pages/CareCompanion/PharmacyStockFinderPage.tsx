import { useEffect, useMemo, useState, useCallback } from "react"
import {
  AlertTriangle,
  Loader2,
  MapPin,
  Package,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { usePharmacyStock } from "./hooks/usePharmacyStock"
import type { PharmacyStock, StockStatus } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PharmacyGroup {
  facilityId: number
  facilityName: string
  distance: number | null
  items: PharmacyStock[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByPharmacy(items: PharmacyStock[]): PharmacyGroup[] {
  const map = new Map<number, PharmacyGroup>()

  for (const item of items) {
    const existing = map.get(item.facilityId)
    if (existing) {
      existing.items.push(item)
    } else {
      map.set(item.facilityId, {
        facilityId: item.facilityId,
        facilityName: item.facilityName,
        distance: item.distance,
        items: [item],
      })
    }
  }

  const groups = Array.from(map.values())
  groups.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  return groups
}

function formatDistance(km: number | null): string {
  if (km == null) return "Distance unknown"
  return `${km.toFixed(1)} km`
}

function formatLastChecked(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return "Checked just now"
  if (diffHours < 24) return `Checked ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "Checked 1 day ago"
  return `Checked ${diffDays} days ago`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StockStatusBadge({ status }: { status: StockStatus }) {
  const config: Record<StockStatus, { label: string; className: string }> = {
    IN_STOCK: {
      label: "In stock",
      className: "bg-success text-green-700",
    },
    LOW_STOCK: {
      label: "Low stock",
      className: "bg-warning text-amber-700",
    },
    OUT_OF_STOCK: {
      label: "Out of stock",
      className: "bg-red-100 text-red-700",
    },
  }

  const c = config[status]
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
        c.className,
      )}
    >
      {c.label}
    </span>
  )
}

function PharmacyCard({ group }: { group: PharmacyGroup }) {
  const latestReport = group.items.reduce((latest, item) => {
    if (!latest) return item.lastReportedAt
    return item.lastReportedAt > latest ? item.lastReportedAt : latest
  }, "" as string)

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-teal-600">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {group.facilityName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDistance(group.distance)}
            </p>
          </div>
        </div>
        {latestReport && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatLastChecked(latestReport)}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {group.items.map((item) => (
          <div
            key={`${item.facilityId}-${item.medicationName}`}
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
          >
            <p className="min-w-0 truncate text-xs font-medium text-foreground">
              {item.medicationName}
            </p>
            <StockStatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PharmacyStockFinderPage() {
  const { data, isLoading, error } = usePharmacyStock()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.PHARMACY_STOCK.VIEW)
  }, [])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchQuery(value)
      trackEvent(EVENTS.CARE_COMPANION.PHARMACY_STOCK.SEARCH, {
        query: value,
      })
    },
    [],
  )

  const filteredGroups = useMemo(() => {
    if (!data) return []

    const query = searchQuery.trim().toLowerCase()
    const filtered = query
      ? data.filter((item) =>
          item.medicationName.toLowerCase().includes(query),
        )
      : data

    return groupByPharmacy(filtered)
  }, [data, searchQuery])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load pharmacy stock information.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by medication name..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full rounded-md border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Search medications"
        />
      </div>

      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Package className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {searchQuery.trim()
              ? "No pharmacies found with this medication"
              : "No pharmacy stock data available"}
          </p>
        </div>
      ) : (
        filteredGroups.map((group) => (
          <PharmacyCard key={group.facilityId} group={group} />
        ))
      )}
    </div>
  )
}
