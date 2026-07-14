import { useState } from "react"
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
import percentTile from "@/assets/icons/percent-tile.png"
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
import { DiscountDetailsDrawer } from "@/Routes/Patient/components/DiscountDetailsDrawer"
import { Facility } from "./types"
import { DiscountCode } from "../DiscountsSection"
import { DashboardStagger, DashboardSection } from "../DashboardStagger"
import type { DashboardAnimationMode } from "../DashboardStagger"

interface DiscoveryHomeViewProps {
  facilities: Facility[]
  discountCodes: DiscountCode[]
  activeTab: "all" | "jireh"
  setActiveTab: (tab: "all" | "jireh") => void
  onFacilitySelect: (facility: Facility) => void
  distanceByFacilityId: Map<string, number>
  locationName?: string | null
  animationMode: DashboardAnimationMode
}

export function DiscoveryHomeView({
  facilities,
  discountCodes,
  activeTab,
  setActiveTab,
  onFacilitySelect,
  distanceByFacilityId,
  locationName,
  animationMode,
}: DiscoveryHomeViewProps) {
  const navigate = useNavigate()
  const verifiedOnly = activeTab === "jireh"
  const verifiedFacilities = facilities.filter(
    (f) => f.verificationStatus === "APPROVED"
  )
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(
    null
  )
  const [isDiscountDrawerOpen, setIsDiscountDrawerOpen] = useState(false)

  return (
    <TabsContent
      value="explore"
      className="flex flex-col w-full max-h-full overflow-y-auto overflow-x-hidden no-scrollbar"
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
      <DashboardStagger
        mode={animationMode}
        className="flex flex-col gap-6 py-4 w-full"
      >
        {/* Active discounts — patient-eligible discount codes */}
        {discountCodes.length > 0 && (
          <DashboardSection
            mode={animationMode}
            className="flex flex-col w-full"
          >
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
                    onClick={() => {
                      setSelectedDiscount(d)
                      setIsDiscountDrawerOpen(true)
                    }}
                    className={`border border-border rounded-xl p-3 text-left flex items-center gap-3 ${
                      discountCodes.length === 1
                        ? "w-full"
                        : "shrink-0 w-[220px]"
                    }`}
                  >
                    <img
                      src={percentTile}
                      alt=""
                      aria-hidden="true"
                      className="w-10 h-10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">
                        {d.description ?? headline}
                      </p>
                      {d.maximumDiscountAmount && (
                        <p className="text-xs text-muted-foreground">
                          up to {d.currency?.symbol ?? ""}{" "}
                          {parseFloat(d.maximumDiscountAmount).toLocaleString()}
                        </p>
                      )}
                      {!d.maximumDiscountAmount && d.validUntil && (
                        <p className="text-xs text-muted-foreground">
                          Valid until {format(new Date(d.validUntil), "d MMM")}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </DashboardSection>
        )}

        {/* Verified partners */}
        {verifiedFacilities.length > 0 && (
          <DashboardSection
            mode={animationMode}
            className="flex flex-col w-full"
          >
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
          </DashboardSection>
        )}

        {/* All/filtered facilities when no special sections apply */}
        {verifiedFacilities.length === 0 && facilities.length > 0 && (
          <DashboardSection
            mode={animationMode}
            className="flex flex-col w-full gap-1"
          >
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
          </DashboardSection>
        )}
      </DashboardStagger>

      <DiscountDetailsDrawer
        discount={selectedDiscount}
        open={isDiscountDrawerOpen}
        onOpenChange={setIsDiscountDrawerOpen}
      />
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
      className="rounded-xl flex-col items-start gap-2 w-full text-left"
    >
      <button type="button" onClick={onClick}>
        <p className="text-base text-foreground truncate w-full">
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
                className="bg-secondary text-secondary-foreground text-sm font-medium px-3 py-1 rounded-md truncate max-w-[96px]"
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
