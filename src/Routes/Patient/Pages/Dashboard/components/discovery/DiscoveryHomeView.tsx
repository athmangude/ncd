import {
  Search,
  MapPin,
  SlidersHorizontal,
  BadgeCheck,
  ChevronRight,
  Percent,
  TrendingUp,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { TabsContent } from "@/components/Tabs"
import { cn } from "@/lib/utils"
import { Facility } from "./types"
import {
  DiscountCode,
} from "../DiscountsSection"

interface DiscoveryHomeViewProps {
  facilities: Facility[]
  discountCodes: DiscountCode[]
  activeTab: "all" | "jireh"
  setActiveTab: (tab: "all" | "jireh") => void
  onFacilitySelect: (facility: Facility) => void
  distanceByFacilityId: Map<string, number>
  locationName?: string | null
}

export function DiscoveryHomeView({
  facilities,
  discountCodes,
  activeTab,
  setActiveTab,
  onFacilitySelect,
  distanceByFacilityId,
  locationName,
}: DiscoveryHomeViewProps) {
  const navigate = useNavigate()
  const verifiedOnly = activeTab === "jireh"
  const verifiedFacilities = facilities.filter(
    (f) => f.verificationStatus === "APPROVED"
  )

  return (
    <TabsContent
      value="explore"
      className="flex flex-col w-full max-h-full overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="bg-white flex flex-col gap-2 items-center p-4 mt-4 w-full shrink-0">
        <div className="flex flex-col gap-1 items-center w-full text-center">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Find care near you
          </h2>
          <p className="text-sm text-muted-foreground">
            Search by name, area, or service.
          </p>
        </div>

        {/* Search bar acts as a navigation trigger to the dedicated Search page */}
        <div className="flex items-center gap-2 h-11 w-full border border-neutral-300 rounded-full pl-3 pr-2 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/patients/search")}
            aria-label="Search facilities"
            className="flex flex-1 min-w-0 items-center gap-2 h-full text-left"
          >
            <Search className="h-4 w-4 text-neutral-500 shrink-0" />
            <span className="flex-1 min-w-0 text-base text-neutral-400 truncate">
              Search facilities
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/patients/search/filters")}
            aria-label="Open filters"
            className="flex items-center gap-1.5 h-6 px-3 bg-purple-100 text-purple-800 text-sm font-medium rounded-full shrink-0"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter
          </button>
        </div>

        {/* Location + Verified row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <MapPin className="h-4 w-4 text-foreground shrink-0" />
            <span className="text-sm text-foreground">{locationName ?? "My location"}</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="text-sm text-foreground">Verified</span>
            <button
              type="button"
              role="switch"
              aria-checked={verifiedOnly}
              onClick={() => setActiveTab(verifiedOnly ? "all" : "jireh")}
              className={cn(
                "h-[18px] w-[33px] rounded-full relative transition-colors shrink-0",
                verifiedOnly ? "bg-primary" : "bg-neutral-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                  verifiedOnly ? "left-[15px]" : "left-[2px]"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable main content */}
      <div className="flex flex-col gap-6 p-4 w-full">
        {/* Active discounts — patient-eligible discount codes */}
        {discountCodes.length > 0 && (
          <div className="flex flex-col w-full">
            <SectionHeader
              icon={<Percent className="h-4 w-4" />}
              title="Active discounts"
              onSeeAll={() => navigate("/patients/discounts")}
            />
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {discountCodes.map((d) => {
                const headline =
                  d.discountType === "PERCENTAGE"
                    ? `${parseFloat(d.discountValue)}% off`
                    : `${d.currency?.symbol ?? ""} ${parseFloat(
                        d.discountValue,
                      ).toLocaleString()} off`
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      navigate(`/patients/discounts/${d.id}`)
                    }
                    className="bg-primary text-white rounded-[14px] p-4 flex flex-col justify-between shrink-0 w-[220px] h-[160px] text-left border-2 border-dashed border-white/30"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-bold leading-tight line-clamp-3">
                        {d.description ?? headline}
                      </p>
                      <p className="text-sm opacity-80 truncate">
                        {d.code}
                      </p>
                    </div>
                    {d.validUntil && (
                      <p className="text-sm opacity-75">
                        Valid until {format(new Date(d.validUntil), "d MMM")}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Verified partners */}
        {verifiedFacilities.length > 0 && (
          <div className="flex flex-col w-full">
            <SectionHeader
              icon={<BadgeCheck className="h-4 w-4" />}
              title="Verified partners"
              count={verifiedFacilities.length}
            />
            <div className="flex flex-col gap-2 w-full">
              {verifiedFacilities.map((f) => (
                <PartnerCard
                  key={f.id}
                  facility={f}
                  distance={distanceByFacilityId.get(f.id) ?? null}
                  onClick={() => onFacilitySelect(f)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All/filtered facilities when no special sections apply */}
        {verifiedFacilities.length === 0 && facilities.length > 0 && (
          <div className="flex flex-col w-full gap-1">
            {facilities.slice(0, 10).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFacilitySelect(f)}
                className="flex gap-2 items-start min-h-8 px-2 py-1.5 rounded-md bg-white w-full text-left"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm text-foreground truncate">
                    {f.name}
                  </span>
                  {f.county && (
                    <span className="text-xs text-muted-foreground">
                      {f.county}
                    </span>
                  )}
                </div>
                {distanceByFacilityId.get(f.id) != null && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {distanceByFacilityId.get(f.id)!.toFixed(1)} km
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  )
}

function SectionHeader({
  icon,
  title,
  count,
  onSeeAll,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  onSeeAll?: () => void
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 w-full">
      <span className="text-foreground">{icon}</span>
      <span className="flex-1 text-sm text-foreground font-medium">{title}</span>
      {count != null && (
        <span className="text-sm text-muted-foreground font-normal">
          {count} partners
        </span>
      )}
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-sm text-neutral-800 font-medium"
        >
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

const CATEGORY_ACRONYMS = new Set(["icu", "ent", "nicu", "hdu", "x-ray", "ct", "mri"])

function formatServiceCategory(slug: string): string {
  const cleaned = slug.replace(/_services$/i, "").replace(/_/g, " ").trim()
  return cleaned
    .split(" ")
    .map((word) =>
      CATEGORY_ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ")
}

const VISIBLE_CATEGORY_PILLS = 2

function PartnerCard({
  facility,
  distance,
  onClick,
}: {
  facility: Facility
  distance: number | null
  onClick: () => void
}) {
  const categories = facility.serviceCategories ?? []
  const visibleCategories = categories.slice(0, VISIBLE_CATEGORY_PILLS)
  const overflowCount = Math.max(0, categories.length - VISIBLE_CATEGORY_PILLS)

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-secondary border border-purple-200 rounded-2xl p-4 flex flex-col gap-3 w-full text-left"
    >
      <p className="text-sm text-foreground truncate w-full leading-tight">
        {facility.name}
      </p>

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>{distance != null ? `${distance.toFixed(1)} km` : "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
          <TrendingUp className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>5% cashback</span>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 w-full">
          {visibleCategories.map((cat) => (
            <span
              key={cat}
              className="bg-purple-200/70 text-purple-700 text-sm font-medium px-3 py-1 rounded-md truncate max-w-[96px]"
            >
              {formatServiceCategory(cat)}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="text-sm text-neutral-500 shrink-0">
              +{overflowCount} more
            </span>
          )}
        </div>
      )}
    </button>
  )
}
