import { useState, useRef } from "react"
import percentTile from "@/assets/icons/percent-tile.png"
import { format } from "date-fns"
import { SectionTitle } from "@/components/SectionTitle"
import { DiscountDetailsDrawer } from "@/Routes/Patient/components/DiscountDetailsDrawer"

interface Currency {
  id: number
  code: string
  name: string
  symbol: string
}

export interface DiscountCode {
  id: number
  code: string
  description: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  currency: Currency
  context: "ORDER_BASED" | "PROMOTIONAL"
  discountAmount: string
  validFrom: string | null
  validUntil: string | null
  minimumOrderAmount: string | null
  maximumDiscountAmount: string | null
  isActive: boolean
  isValid: boolean
  /** Present when a discount is scoped to a single facility; absent/null for app-wide discounts. */
  facility?: { id: number; name: string } | null
}

interface DiscountsSectionProps {
  discounts?: DiscountCode[]
}

function discountHeadline(discount: DiscountCode): string {
  const value = parseFloat(discount.discountValue)
  return discount.discountType === "PERCENTAGE"
    ? `${value}% off`
    : `${discount.currency.symbol} ${value.toLocaleString()} off`
}

export function DiscountsSection({ discounts = [] }: DiscountsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(
    null
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const firstCard = container.firstElementChild
      if (firstCard) {
        const cardWidth = firstCard.getBoundingClientRect().width
        const gap = 16 // gap-4 is 16px
        const scrollPosition = container.scrollLeft
        const index = Math.round(scrollPosition / (cardWidth + gap))

        // Clamp index to bounds
        const safeIndex = Math.min(Math.max(0, index), discounts.length - 1)

        if (safeIndex !== activeIndex) {
          setActiveIndex(safeIndex)
        }
      }
    }
  }

  const handleCardClick = (discount: DiscountCode) => {
    setSelectedDiscount(discount)
    setIsDrawerOpen(true)
  }

  if (discounts.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <SectionTitle>Discounts & Offers</SectionTitle>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar"
      >
        {discounts.map((discount) => (
          <button
            key={discount.id}
            type="button"
            onClick={() => handleCardClick(discount)}
            className={`border border-border rounded-xl p-3 text-left flex items-center gap-3 ${
              discounts.length === 1 ? "w-full" : "shrink-0 w-[220px]"
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
                {discount.description ?? discountHeadline(discount)}
              </p>
              {discount.maximumDiscountAmount && (
                <p className="text-xs text-muted-foreground">
                  up to {discount.currency.symbol}{" "}
                  {parseFloat(discount.maximumDiscountAmount).toLocaleString()}
                </p>
              )}
              {!discount.maximumDiscountAmount && discount.validUntil && (
                <p className="text-xs text-muted-foreground">
                  Valid until {format(new Date(discount.validUntil), "d MMM")}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {discounts.length > 1 && (
        <div className="flex justify-center gap-2">
          {discounts.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-8 bg-primary" : "w-1.5 bg-muted"}`}
            ></div>
          ))}
        </div>
      )}

      <DiscountDetailsDrawer
        discount={selectedDiscount}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}
