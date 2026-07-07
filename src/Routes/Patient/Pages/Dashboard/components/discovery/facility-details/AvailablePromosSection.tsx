import { ChevronRight, Gift } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import percentTile from "@/assets/icons/percent-tile.png"
import { SectionTitle } from "@/components/SectionTitle"
import { ActiveDiscount, FacilityActiveDiscount } from "../types"

interface AvailablePromosSectionProps {
  facilityId: string
  facilityName: string
  promos: FacilityActiveDiscount[]
}

export function AvailablePromosSection({
  facilityId,
  facilityName,
  promos,
}: AvailablePromosSectionProps) {
  const navigate = useNavigate()
  if (promos.length === 0) return null

  const handleSeeAll = () => {
    const discounts: ActiveDiscount[] = promos.map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      validFrom: null,
      validUntil: p.validUntil,
      maximumDiscountAmount: p.maximumDiscountAmount,
      facility: {
        id: Number(facilityId),
        name: facilityName,
        county: null,
        locationName: null,
        latitude: null,
        longitude: null,
        facilityType: null,
        placeImageUrl: null,
      },
    }))
    navigate("/patients/discounts", { state: { discounts } })
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 py-1.5 w-full">
        <Gift className="h-4 w-4 text-muted-foreground" />
        <SectionTitle className="flex-1">Available promos</SectionTitle>
        {promos.length > 1 && (
          <button
            type="button"
            onClick={handleSeeAll}
            className="flex items-center gap-0.5 text-sm text-foreground "
          >
            See all
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {promos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => navigate(`/patients/discounts/${p.id}`)}
            className="border border-border rounded-xl p-3 shrink-0 w-[220px] text-left flex items-center gap-3"
          >
            <img
              src={percentTile}
              alt=""
              aria-hidden="true"
              className="w-10 h-10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm  text-foreground line-clamp-2">
                {p.description ?? buildHeadline(p)}
              </p>
              {p.maximumDiscountAmount && (
                <p className="text-xs text-muted-foreground">
                  up to KES{" "}
                  {parseFloat(p.maximumDiscountAmount).toLocaleString()}
                </p>
              )}
              {!p.maximumDiscountAmount && p.validUntil && (
                <p className="text-xs text-muted-foreground">
                  Valid until {format(new Date(p.validUntil), "d MMM")}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function buildHeadline(p: FacilityActiveDiscount): string {
  const value = parseFloat(p.discountValue ?? "0")
  if (p.discountType === "PERCENTAGE") return `${value}% off`
  return `KES ${value.toLocaleString()} off`
}
