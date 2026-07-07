import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import AppShell from "@/Routes/AppShell"
import { Button } from "@/components/Button"
import { Switch } from "@/components/Switch"
import { Skeleton } from "@/components/Skeleton"
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Clock,
  History,
  MapPin,
  Search,
  SlidersHorizontal,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { useDiscovery } from "./useDiscovery"
import { useRecentSearches } from "./api/useRecentSearches"
import { useLogRecentSearch } from "./api/useLogRecentSearch"
import { usePreferredProviders } from "./api/usePreferredProviders"
import { Facility } from "./types"

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

  const header = (
    <SearchHeader
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      verifiedOnly={verifiedOnly}
      toggleVerified={() => setActiveTab(verifiedOnly ? "all" : "jireh")}
      locationName={locationName}
      onBack={() => navigate(-1)}
      chips={chips}
      hasActiveFilters={hasActiveFilters}
      onFilterTap={() => navigate("/patients/search/filters")}
    />
  )

  return (
    <AppShell header={header} footer={null} bodyPadding="none">
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
          <div className="flex flex-col gap-3 w-full">
            {filteredFacilities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No facilities match.
              </p>
            ) : (
              filteredFacilities.map((f) => (
                <FacilityResultRow
                  key={f.id}
                  facility={f}
                  km={kmById.get(f.id) ?? null}
                  locationLoading={userLocation == null}
                  onClick={() => onResultTap(f)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function SearchHeader({
  searchQuery,
  setSearchQuery,
  verifiedOnly,
  toggleVerified,
  locationName,
  onBack,
  chips,
  hasActiveFilters,
  onFilterTap,
}: {
  searchQuery: string
  setSearchQuery: (q: string) => void
  verifiedOnly: boolean
  toggleVerified: () => void
  locationName: string | null | undefined
  onBack: () => void
  chips: Array<{ id: string; label: string; onRemove: () => void }>
  hasActiveFilters: boolean
  onFilterTap: () => void
}) {
  return (
    <div className="bg-white flex flex-col gap-2 p-4 w-full border-b border-border">
      <div className="flex items-center gap-2 self-start">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="capitalize">Search</h1>
      </div>

      <div className="flex flex-col gap-1 items-center w-full text-center mt-4">
        <h2 className="text-foreground">Find care near you</h2>
        <p className="text-sm text-muted-foreground">
          Search by name, area, or service.
        </p>
      </div>

      <div className="flex items-center gap-2 h-11 w-full border border-border rounded-full pl-3 pr-2 bg-white shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          className="flex-1 min-w-0 text-base bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          placeholder="Search facilities"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <button
          type="button"
          onClick={onFilterTap}
          className={cn(
            "flex items-center gap-1.5 h-6 px-3 text-sm font-medium rounded-full shrink-0 transition-colors",
            hasActiveFilters
              ? "bg-primary text-white"
              : "bg-purple-100 text-purple-800"
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filter
        </button>
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
          <button
            key={c.id}
            type="button"
            onClick={c.onRemove}
            className="flex items-center gap-1 h-6 px-2 bg-teal-50 text-teal-800 border border-teal-300 text-xs rounded-full"
          >
            {c.label}
            <X className="h-3 w-3" />
          </button>
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
      <p className="text-sm text-foreground font-medium py-1.5">{title}</p>
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
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-2 rounded-md bg-white text-left"
    >
      {icon}
      <span className="flex-1 text-sm text-foreground truncate">{label}</span>
      {chevron && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </button>
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
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1 px-2 py-2 rounded-md bg-white text-left"
    >
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
  )
}
