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
import { Switch } from "@/components/Switch"
import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/Item"
import { SectionTitle } from "@/components/SectionTitle"
import { Facility } from "./types"
import { DiscountCode } from "../DiscountsSection"

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
      {/* Header — horizontal padding comes from the shell's p-4 like the other
          tabs; only vertical padding here. */}
      <div className="flex flex-col gap-2 items-center w-full shrink-0">
        <div className="flex flex-col gap-1 items-center w-full text-center">
          <h1 className="text-foreground">Find care near you</h1>
          <p className="text-sm text-muted-foreground">
            Search by name, area, or service.
          </p>
        </div>

        {/* Search bar acts as a navigation trigger to the dedicated Search page */}
        <div className="flex items-center gap-2 h-11 w-full border border-border rounded-full pl-3 pr-2 bg-card shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/patients/search")}
            aria-label="Search facilities"
            className="flex flex-1 min-w-0 items-center gap-2 h-full text-left"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 min-w-0 text-base text-muted-foreground truncate">
              Search facilities
            </span>
          </button>
          <Chip
            onClick={() => navigate("/patients/search/filters")}
            aria-label="Open filters"
            className="shrink-0"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter
          </Chip>
        </div>

        {/* Location + Verified row */}
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
              onCheckedChange={() =>
                setActiveTab(verifiedOnly ? "all" : "jireh")
              }
            />
          </div>
        </div>
      </div>

      {/* Scrollable main content. Horizontal padding comes from the shell's
          p-4 (like every other dashboard tab) — only add vertical spacing here,
          so the content isn't double-inset. */}
      <div className="flex flex-col gap-6 py-4 w-full">
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
                        d.discountValue
                      ).toLocaleString()} off`
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => navigate(`/patients/discounts/${d.id}`)}
                    className="bg-primary text-white rounded-[14px] p-4 flex flex-col justify-between shrink-0 w-[220px] h-[160px] text-left border-2 border-dashed border-white/30"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-bold leading-tight line-clamp-3">
                        {d.description ?? headline}
                      </p>
                      <p className="text-sm opacity-80 truncate">{d.code}</p>
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
              <Item key={f.id} asChild size="sm" className="bg-card text-left">
                <button type="button" onClick={() => onFacilitySelect(f)}>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="truncate">{f.name}</ItemTitle>
                    {f.county && (
                      <ItemDescription className="text-xs">
                        {f.county}
                      </ItemDescription>
                    )}
                  </ItemContent>
                  {distanceByFacilityId.get(f.id) != null && (
                    <ItemActions className="text-xs text-muted-foreground shrink-0">
                      {distanceByFacilityId.get(f.id)!.toFixed(1)} km
                    </ItemActions>
                  )}
                </button>
              </Item>
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
      <SectionTitle className="flex-1">{title}</SectionTitle>
      {count != null && (
        <span className="text-sm text-muted-foreground font-normal">
          {count} partners
        </span>
      )}
      {onSeeAll && (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onSeeAll}
          className="text-foreground"
        >
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

const CATEGORY_ACRONYMS = new Set([
  "icu",
  "ent",
  "nicu",
  "hdu",
  "x-ray",
  "ct",
  "mri",
])

function formatServiceCategory(slug: string): string {
  const cleaned = slug
    .replace(/_services$/i, "")
    .replace(/_/g, " ")
    .trim()
  return cleaned
    .split(" ")
    .map((word) =>
      CATEGORY_ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
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
    <Item
      asChild
      className="bg-secondary border-purple-200 rounded-2xl flex-col items-start gap-3 w-full text-left"
    >
      <button type="button" onClick={onClick}>
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
              <span className="text-sm text-muted-foreground shrink-0">
                +{overflowCount} more
              </span>
            )}
          </div>
        )}
      </button>
    </Item>
  )
}
