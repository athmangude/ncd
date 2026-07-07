import { useEffect } from "react"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Percent, ChevronRight, Loader2 } from "lucide-react"
import PatientPageWrapper from "./PatientPageWrapper"
import { useEligibleDiscountCodes } from "./Dashboard/hooks/useEligibleDiscountCodes"
import { useOffline } from "@/hooks/useOffline"
import { trackEvent, EVENTS } from "@/analytics"

export default function PatientDiscountsList() {
  const navigate = useNavigate()
  const isOffline = useOffline()
  const { data: discounts = [], isLoading } = useEligibleDiscountCodes(
    !isOffline,
  )

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
        <div className="flex flex-col gap-2 py-2">
          {discounts.map((d) => {
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
                onClick={() => navigate(`/patients/discounts/${d.id}`)}
                className="flex items-center gap-3 w-full text-left bg-white border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <Percent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground line-clamp-2">
                    {d.description ?? headline}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {d.code}
                  </p>
                  {d.validUntil && (
                    <p className="text-xs text-muted-foreground">
                      Valid until {format(new Date(d.validUntil), "d MMM")}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            )
          })}
        </div>
      )}
    </PatientPageWrapper>
  )
}
