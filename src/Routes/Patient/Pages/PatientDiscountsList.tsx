import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Percent, Loader2 } from "lucide-react"
import percentTile from "@/assets/icons/percent-tile.png"
import PatientPageWrapper from "./PatientPageWrapper"
import { useEligibleDiscountCodes } from "./Dashboard/hooks/useEligibleDiscountCodes"
import { useOffline } from "@/hooks/useOffline"
import { trackEvent, EVENTS } from "@/analytics"
import { DiscountDetailsDrawer } from "../components/DiscountDetailsDrawer"
import type { DiscountCode } from "./Dashboard/components/DiscountsSection"

export default function PatientDiscountsList() {
  const navigate = useNavigate()
  const isOffline = useOffline()
  const { data: discounts = [], isLoading } =
    useEligibleDiscountCodes(!isOffline)
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(
    null
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    if (isLoading) return
    trackEvent(EVENTS.DISCOVERY.DISCOUNTS_LIST_VIEW, {
      count: discounts.length,
    })
    // count is captured once results land; intentional single-fire
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  return (
    <PatientPageWrapper
      title="Active discounts"
      onBack={() => navigate(-1)}
      className="min-h-screen"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <Percent className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-[28ch]">
            No active discounts to show. Open the Explore tab to find nearby
            facilities with discounts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-2">
          {discounts.map((d) => {
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
                  setIsDrawerOpen(true)
                }}
                className="border border-border rounded-xl p-3 w-full text-left flex items-center gap-3"
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
      )}

      <DiscountDetailsDrawer
        discount={selectedDiscount}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </PatientPageWrapper>
  )
}
