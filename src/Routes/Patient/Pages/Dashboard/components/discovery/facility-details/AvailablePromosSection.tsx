import { useState } from "react"
import { ChevronRight, Gift } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import percentTile from "@/assets/icons/percent-tile.png"
import { Button } from "@/components/Button"
import { SectionTitle } from "@/components/SectionTitle"
import { DiscountDetailsDrawer } from "@/Routes/Patient/components/DiscountDetailsDrawer"
import type { DiscountCode } from "../../DiscountsSection"
import { FacilityActiveDiscount } from "../types"

interface AvailablePromosSectionProps {
  facilityId: string
  facilityName: string
  promos: FacilityActiveDiscount[]
}

export function AvailablePromosSection({
  facilityName,
  promos,
}: AvailablePromosSectionProps) {
  const navigate = useNavigate()
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // FacilityActiveDiscount is a partial shape (no currency, minimumOrderAmount,
  // validFrom) — fetch the full DiscountCode by id so the shared drawer has
  // everything it needs (Min. bill, currency symbol for FIXED_AMOUNT, etc.).
  const { data: fullDiscount, isFetching } = useQuery({
    queryKey: ["discountCode", selectedPromoId],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/discount-codes/${selectedPromoId}`
      )
      return (response.data?.data ?? null) as DiscountCode | null
    },
    enabled: selectedPromoId != null,
  })

  if (promos.length === 0) return null

  const handlePromoClick = (promo: FacilityActiveDiscount) => {
    setSelectedPromoId(promo.id)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 py-1.5 w-full">
        <Gift className="h-4 w-4 text-muted-foreground" />
        <SectionTitle className="flex-1">Available promos</SectionTitle>
        {promos.length > 1 && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => navigate("/patients/discounts")}
            className="text-foreground"
          >
            See all
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {promos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePromoClick(p)}
            className={`border border-border rounded-xl p-3 text-left flex items-center gap-3 ${
              promos.length === 1 ? "w-full" : "shrink-0 w-[220px]"
            }`}
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

      <DiscountDetailsDrawer
        discount={
          isFetching
            ? null
            : (fullDiscount ??
              fallbackDiscount(selectedPromoId, promos, facilityName))
        }
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) setSelectedPromoId(null)
        }}
      />
    </div>
  )
}

function buildHeadline(p: FacilityActiveDiscount): string {
  const value = parseFloat(p.discountValue ?? "0")
  if (p.discountType === "PERCENTAGE") return `${value}% off`
  return `KES ${value.toLocaleString()} off`
}

// If the fetch-by-id fails (offline, mock gap, etc.), fall back to rendering
// with the partial shape already in hand rather than showing nothing —
// Min. bill/currency-driven fields degrade gracefully to "—" in the drawer.
function fallbackDiscount(
  id: number | null,
  promos: FacilityActiveDiscount[],
  facilityName: string
): DiscountCode | null {
  const promo = promos.find((p) => p.id === id)
  if (!promo) return null
  return {
    id: promo.id,
    code: promo.code,
    description: promo.description ?? "",
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    currency: { id: 0, code: "KES", name: "Kenyan Shilling", symbol: "KES" },
    context: "PROMOTIONAL",
    discountAmount: "0",
    validFrom: null,
    validUntil: promo.validUntil,
    minimumOrderAmount: null,
    maximumDiscountAmount: promo.maximumDiscountAmount,
    isActive: true,
    isValid: true,
    facility: { id: 0, name: facilityName },
  }
}
