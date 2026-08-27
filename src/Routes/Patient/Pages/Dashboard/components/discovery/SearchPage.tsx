import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import PatientPageWrapper from "@/Routes/Patient/Pages/PatientPageWrapper"
import { Switch } from "@/components/Switch"
import { Skeleton } from "@/components/Skeleton"
import { SectionTitle } from "@/components/SectionTitle"
import { Chip } from "@/components/Chip"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/Item"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { cn } from "@/lib/utils"
import {
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  History,
  MapPin,
  Pill,
  Search,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react"
import { trackEvent, EVENTS } from "@/analytics"
import { useDiscovery } from "./useDiscovery"
import { useRecentSearches } from "./api/useRecentSearches"
import { useLogRecentSearch } from "./api/useLogRecentSearch"
import { usePreferredProviders } from "./api/usePreferredProviders"
import { useStockSearch } from "./api/useStockSearch"
import type { StockSearchGroup } from "./api/useStockSearch"
import { Facility } from "./types"
import type { PharmacyStock, StockStatus } from "@/types/care-companion"

const URBAN_KMH = 30

function estimateMinutes(km: number | null | undefined): number | null {
  if (km == null || Number.isNaN(km)) return null
  const minutes = Math.round((km / URBAN_KMH) * 60)
  return Math.max(1, minutes)
}

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getFacilityKm(
  facility: Facility,
  userLocation: { lat: number; lng: number } | null
): number | null {
  if (facility.distance != null && !Number.isNaN(facility.distance)) {
    return facility.distance
  }
  if (!userLocation) return null
  const lat = parseFloat(facility.latitude)
  const lng = parseFloat(facility.longitude)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  return distanceKm(userLocation.lat, userLocation.lng, lat, lng)
}

export default function SearchPage() {
  const navigate = useNavigate()
  const {
    filteredFacilities,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    userLocation,
    locationName,
    serviceCategories,
    setServiceCategories,
  } = useDiscovery(true)

  const verifiedOnly = activeTab === "jireh"
  const isSearching =
    searchQuery.trim().length > 0 ||
    verifiedOnly ||
    serviceCategories.length > 0

  const recentSearchesQuery = useRecentSearches()
  const preferredProvidersQuery = usePreferredProviders()
  const logRecentSearch = useLogRecentSearch()

  const { data: stockResults = [] } = useStockSearch(searchQuery)
  const [drawerGroup, setDrawerGroup] = useState<StockSearchGroup | null>(null)

  const sortedDrawerEntries = useMemo(() => {
    if (!drawerGroup || !userLocation) return drawerGroup?.entries ?? []
    return [...drawerGroup.entries].sort((a, b) => {
      const da = getStockDriveInfo(a, userLocation)
      const db = getStockDriveInfo(b, userLocation)
      return (da?.distanceKm ?? Infinity) - (db?.distanceKm ?? Infinity)
    })
  }, [drawerGroup, userLocation])

  useEffect(() => {
    trackEvent(EVENTS.DISCOVERY.SEARCH_PAGE_VIEW)
  }, [])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length === 0) return
    const id = setTimeout(() => {
      trackEvent(EVENTS.DISCOVERY.SEARCH_SUBMIT, { queryLength: q.length })
    }, 500)
    return () => clearTimeout(id)
  }, [searchQuery])

  const kmById = useMemo(() => {
    const map = new Map<string, number>()
    filteredFacilities.forEach((f) => {
      const km = getFacilityKm(f, userLocation)
      if (km != null) map.set(f.id, km)
    })
    return map
  }, [filteredFacilities, userLocation])

  const goToFacility = (facilityId: string | number) =>
    navigate(`/patients/facility/${facilityId}`)

  const onResultTap = (f: Facility) => {
    trackEvent(EVENTS.DISCOVERY.SEARCH_RESULT_TAP, {
      facilityId: f.id,
      hasCashback: f.verificationStatus === "APPROVED",
    })
    const fallbackId = Number(f.id)
    const numericFacilityId =
      f.facility?.id ?? (Number.isInteger(fallbackId) ? fallbackId : null)
    if (numericFacilityId != null) {
      logRecentSearch.mutate(numericFacilityId)
    }
    goToFacility(f.id)
  }

  const onRecentTap = (facilityId: number) => {
    trackEvent(EVENTS.DISCOVERY.SEARCH_RECENT_TAP, { facilityId })
    goToFacility(facilityId)
  }

  const onPreferredTap = (facilityId: number) => {
    trackEvent(EVENTS.DISCOVERY.SEARCH_PREFERRED_TAP, { facilityId })
    goToFacility(facilityId)
  }

  const chips: Array<{ id: string; label: string; onRemove: () => void }> = []
  if (verifiedOnly) {
    chips.push({
      id: "jireh",
      label: "Jireh partners",
      onRemove: () => {
        trackEvent(EVENTS.DISCOVERY.FILTER_CHIP_REMOVE, { filterId: "jireh" })
        setActiveTab("all")
      },
    })
  }
  serviceCategories.forEach((cat) => {
    chips.push({
      id: `category:${cat}`,
      label: cat.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      onRemove: () => {
        trackEvent(EVENTS.DISCOVERY.FILTER_CHIP_REMOVE, {
          filterId: `category:${cat}`,
        })
        setServiceCategories(serviceCategories.filter((c) => c !== cat))
      },
    })
  })

  const hasActiveFilters = chips.length > 0

  return (
    <PatientPageWrapper
      title="Search"
      onBack={() => navigate(-1)}
      bodyPadding="none"
    >
      {/* Search controls live in the body (not the app bar) so the bar stays
          canonical chrome. They stick to the top so the input + filters stay
          reachable while results scroll beneath. */}
      <SearchControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        verifiedOnly={verifiedOnly}
        toggleVerified={() => setActiveTab(verifiedOnly ? "all" : "jireh")}
        locationName={locationName}
        chips={chips}
        hasActiveFilters={hasActiveFilters}
        onFilterTap={() => navigate("/patients/search/filters")}
      />

      <div className="flex flex-col gap-6 p-4 w-full">
        {!isSearching && (
          <EmptyState
            recent={recentSearchesQuery.data ?? []}
            recentLoading={recentSearchesQuery.isLoading}
            recentError={recentSearchesQuery.isError}
            preferred={preferredProvidersQuery.data ?? []}
            preferredLoading={preferredProvidersQuery.isLoading}
            preferredError={preferredProvidersQuery.isError}
            onRecentTap={onRecentTap}
            onPreferredTap={onPreferredTap}
          />
        )}

        {isSearching && (
          <div className="flex flex-col gap-4 w-full">
            {stockResults.length > 0 && (
              <StockResultsSection
                groups={stockResults}
                onGroupTap={setDrawerGroup}
              />
            )}

            <div className="flex flex-col gap-3 w-full">
              {filteredFacilities.length === 0 && stockResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results match your search.
                </p>
              ) : filteredFacilities.length === 0 ? null : (
                <>
                  {stockResults.length > 0 && (
                    <SectionTitle level={3} className="pt-2">
                      Facilities
                    </SectionTitle>
                  )}
                  {filteredFacilities.map((f) => (
                    <FacilityResultRow
                      key={f.id}
                      facility={f}
                      km={kmById.get(f.id) ?? null}
                      locationLoading={userLocation == null}
                      onClick={() => onResultTap(f)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Drawer
        open={drawerGroup !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerGroup(null)
        }}
      >
        <DrawerContent className="max-h-[85dvh]">
          {drawerGroup && (
            <>
              <DrawerHeader className="pb-2">
                <DrawerTitle className="text-base">
                  {drawerGroup.name}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
                  Available at{" "}
                  {drawerGroup.entries.filter((e) => e.status !== "OUT_OF_STOCK").length}{" "}
                  {drawerGroup.entries.filter((e) => e.status !== "OUT_OF_STOCK").length === 1
                    ? "facility"
                    : "facilities"}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-2 overflow-y-auto">
                {sortedDrawerEntries.map((entry) => (
                  <StockFacilityRow
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
    </PatientPageWrapper>
  )
}

function SearchControls({
  searchQuery,
  setSearchQuery,
  verifiedOnly,
  toggleVerified,
  locationName,
  chips,
  hasActiveFilters,
  onFilterTap,
}: {
  searchQuery: string
  setSearchQuery: (q: string) => void
  verifiedOnly: boolean
  toggleVerified: () => void
  locationName: string | null | undefined
  chips: Array<{ id: string; label: string; onRemove: () => void }>
  hasActiveFilters: boolean
  onFilterTap: () => void
}) {
  return (
    <div className="bg-card flex flex-col gap-2 p-4 w-full border-b border-border sticky top-0 z-10">
      <div className="flex flex-col gap-1 items-center w-full text-center">
        <SectionTitle>Find care near you</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Search facilities, medications, or lab tests.
        </p>
      </div>

      <div className="flex items-center gap-2 h-11 w-full border border-border rounded-full pl-3 pr-2 bg-card shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          className="flex-1 min-w-0 text-base bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          placeholder="Search facilities, meds, or tests"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <Chip
          variant={hasActiveFilters ? "default" : "secondary"}
          onClick={onFilterTap}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filter
        </Chip>
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <MapPin className="h-4 w-4 text-foreground shrink-0" />
          <span className="text-sm text-foreground">
            {locationName ?? "My location"}
          </span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="text-sm text-foreground">Verified</span>
          <Switch
            size="sm"
            checked={verifiedOnly}
            onCheckedChange={toggleVerified}
            aria-label="Show verified providers only"
          />
        </div>
      </div>

      <FilterChipsRow chips={chips} />
    </div>
  )
}

function FilterChipsRow({
  chips,
}: {
  chips: Array<{ id: string; label: string; onRemove: () => void }>
}) {
  if (chips.length === 0) return null
  return (
    <div className="flex flex-col gap-1 pt-1">
      <span className="text-xs font-medium text-muted-foreground">
        Selected filters · {chips.length}
      </span>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Chip
            key={c.id}
            variant="outline"
            onClick={c.onRemove}
            onRemove={c.onRemove}
            removeLabel={`Remove ${c.label}`}
          >
            {c.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function EmptyState({
  recent,
  recentLoading,
  recentError,
  preferred,
  preferredLoading,
  preferredError,
  onRecentTap,
  onPreferredTap,
}: {
  recent: Array<{ id: string; facility: { id: number; name: string } }>
  recentLoading: boolean
  recentError: boolean
  preferred: Array<{ id: string; facility: { id: number; name: string } }>
  preferredLoading: boolean
  preferredError: boolean
  onRecentTap: (facilityId: number) => void
  onPreferredTap: (facilityId: number) => void
}) {
  return (
    <>
      {!recentError && (
        <Section title="Recent searches">
          {recentLoading ? (
            <SkeletonRows count={3} />
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-1.5">
              Your recent searches will appear here.
            </p>
          ) : (
            recent.map((r) => (
              <SimpleRow
                key={r.id}
                icon={<History className="h-4 w-4 text-foreground shrink-0" />}
                label={r.facility.name}
                onClick={() => onRecentTap(r.facility.id)}
              />
            ))
          )}
        </Section>
      )}

      {!preferredError && (
        <Section title="Preferred providers">
          {preferredLoading ? (
            <SkeletonRows count={3} />
          ) : preferred.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-1.5">
              Save providers from their detail page to see them here.
            </p>
          ) : (
            preferred.map((p) => (
              <SimpleRow
                key={p.id}
                icon={
                  <Building2 className="h-4 w-4 text-foreground shrink-0" />
                }
                label={p.facility.name}
                chevron
                onClick={() => onPreferredTap(p.facility.id)}
              />
            ))
          )}
        </Section>
      )}
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col w-full">
      <SectionTitle level={3} className="py-1.5">
        {title}
      </SectionTitle>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function SimpleRow({
  icon,
  label,
  chevron,
  onClick,
}: {
  icon?: React.ReactNode
  label: string
  chevron?: boolean
  onClick: () => void
}) {
  return (
    <Item asChild size="sm">
      <button type="button" onClick={onClick}>
        <ItemMedia>{icon}</ItemMedia>
        <ItemContent>
          <ItemTitle className="truncate">{label}</ItemTitle>
        </ItemContent>
        {chevron && (
          <ItemActions>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </ItemActions>
        )}
      </button>
    </Item>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2 px-2 py-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-3/4 bg-muted rounded" />
      ))}
    </div>
  )
}

function FacilityResultRow({
  facility,
  km,
  locationLoading,
  onClick,
}: {
  facility: Facility
  km: number | null
  locationLoading: boolean
  onClick: () => void
}) {
  const minutes = estimateMinutes(km)
  const area = facility.locationName ?? facility.county ?? null
  const isApproved = facility.verificationStatus === "APPROVED"
  const showDriveTimeSkeleton = minutes == null && locationLoading

  return (
    <Item
      asChild
      size="sm"
      className="flex-col items-start gap-1 bg-card text-left"
    >
      <button type="button" onClick={onClick}>
        <span className="text-base font-medium text-foreground truncate">
          {facility.name}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {minutes != null ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />~{minutes} min
            </span>
          ) : showDriveTimeSkeleton ? (
            <span
              className="inline-flex items-center gap-1"
              aria-label="Calculating drive time"
            >
              <Clock className="h-3 w-3" />
              <Skeleton className="h-3 w-12 bg-muted rounded" />
            </span>
          ) : null}
          {area && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {area}
            </span>
          )}
        </div>
        {isApproved && (
          <span className="inline-flex items-center gap-1 self-start mt-1 h-6 px-2 bg-teal-50 text-teal-800 text-xs rounded-full">
            <BadgeCheck className="h-3 w-3" />
            Earn 5% cashback here
          </span>
        )}
      </button>
    </Item>
  )
}

// ---------------------------------------------------------------------------
// Medication & test stock search results
// ---------------------------------------------------------------------------

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

function getStockDriveInfo(
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

function formatStockDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function formatStockDriveTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatStockPrice(price: number | undefined) {
  if (price == null) return null
  if (price === 0) return "Free"
  return `KES ${price.toLocaleString()}`
}

const STOCK_STATUS_CONFIG: Record<
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

function StockResultsSection({
  groups,
  onGroupTap,
}: {
  groups: StockSearchGroup[]
  onGroupTap: (g: StockSearchGroup) => void
}) {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 py-1.5">
        <Pill className="h-4 w-4 text-foreground" />
        <SectionTitle level={3}>Medications & tests</SectionTitle>
      </div>
      <div className="flex flex-col gap-2">
        {groups.map((g) => {
          const inStock = g.entries.filter(
            (e) => e.status === "IN_STOCK" || e.status === "LOW_STOCK",
          ).length
          const prices = g.entries
            .map((e) => e.priceKES)
            .filter((p): p is number => p != null && p > 0)
          const minPrice = prices.length > 0 ? Math.min(...prices) : null

          return (
            <Item
              key={g.name}
              asChild
              size="sm"
              className="bg-card text-left"
            >
              <button type="button" onClick={() => onGroupTap(g)}>
                <ItemMedia>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{g.name}</ItemTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {inStock > 0 ? (
                      <span className="text-emerald-700">
                        In stock at {inStock}{" "}
                        {inStock === 1 ? "facility" : "facilities"}
                      </span>
                    ) : (
                      <span className="text-red-600">Out of stock nearby</span>
                    )}
                    {minPrice != null && (
                      <span>from KES {minPrice.toLocaleString()}</span>
                    )}
                  </div>
                </ItemContent>
                <ItemActions>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </ItemActions>
              </button>
            </Item>
          )
        })}
      </div>
    </div>
  )
}

function StockFacilityRow({
  entry,
  userLocation,
}: {
  entry: PharmacyStock
  userLocation: { lat: number; lng: number } | null
}) {
  const config = STOCK_STATUS_CONFIG[entry.status]
  const Icon = config.icon
  const price = formatStockPrice(entry.priceKES)
  const drive = getStockDriveInfo(entry, userLocation)

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
                {formatStockDriveTime(drive.driveMinutes)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatStockDistance(drive.distanceKm)}
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
