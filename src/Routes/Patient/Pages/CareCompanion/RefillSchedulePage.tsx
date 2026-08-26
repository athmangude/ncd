import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  Loader2,
  Pill,
  Clock,
  MapPin,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import { useRefillSchedule } from "./hooks/useRefillSchedule"
import type { RefillScheduleItem, RefillStatus } from "@/types/care-companion"

const STATUS_SORT_ORDER: Record<RefillStatus, number> = {
  OVERDUE: 0,
  DUE: 1,
  UPCOMING: 2,
  REFILLED: 3,
  CANCELLED: 4,
}

function sortByUrgency(a: RefillScheduleItem, b: RefillScheduleItem): number {
  const aOrder = STATUS_SORT_ORDER[a.status] ?? 99
  const bOrder = STATUS_SORT_ORDER[b.status] ?? 99
  if (aOrder !== bOrder) return aOrder - bOrder
  return a.daysUntilRefill - b.daysUntilRefill
}

function StatusBadge({ status }: { status: RefillStatus }) {
  const config: Record<
    string,
    { label: string; className: string }
  > = {
    OVERDUE: {
      label: "Overdue",
      className: "bg-red-100 text-red-700",
    },
    DUE: {
      label: "Due soon",
      className: "bg-amber-100 text-amber-700",
    },
    UPCOMING: {
      label: "Upcoming",
      className: "bg-muted text-muted-foreground",
    },
    REFILLED: {
      label: "Refilled",
      className: "bg-success text-green-700",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground",
    },
  }

  const c = config[status] ?? config.UPCOMING
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
        c.className,
      )}
    >
      {c.label}
    </span>
  )
}

function DaysLabel({ daysUntilRefill }: { daysUntilRefill: number }) {
  if (daysUntilRefill < 0) {
    const overdueDays = Math.abs(daysUntilRefill)
    return (
      <span className="text-xs text-red-600">
        {overdueDays} {overdueDays === 1 ? "day" : "days"} overdue
      </span>
    )
  }

  if (daysUntilRefill === 0) {
    return <span className="text-xs text-amber-600">Due today</span>
  }

  return (
    <span className="text-xs text-muted-foreground">
      In {daysUntilRefill} {daysUntilRefill === 1 ? "day" : "days"}
    </span>
  )
}

function RefillItemCard({ item }: { item: RefillScheduleItem }) {
  const navigate = useNavigate()

  function handleTap() {
    trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_TAP, {
      medicationName: item.medicationName,
      status: item.status,
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleTap()
        }
      }}
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors active:bg-muted/50",
        item.status === "OVERDUE" && "border-red-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              item.status === "OVERDUE"
                ? "bg-red-100 text-red-600"
                : item.status === "DUE"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-primary/10 text-primary",
            )}
          >
            <Pill className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {item.medicationName}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              <DaysLabel daysUntilRefill={item.daysUntilRefill} />
            </div>
            {item.estimatedDaysSupply != null && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.estimatedDaysSupply}-day supply
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.escalatedToLoanOffer && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.APPLY_CREDIT_TAP, {
              medicationName: item.medicationName,
            })
            navigate("/patients/care-companion/medication-loan")
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors active:bg-primary/20"
        >
          <CreditCard className="h-3.5 w-3.5" />
          Loan available
        </button>
      )}
    </div>
  )
}

export default function RefillSchedulePage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useRefillSchedule()

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.VIEW)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load your refill schedule.
        </p>
      </div>
    )
  }

  const sorted = [...data.schedules].sort(sortByUrgency)

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center px-4">
        <Pill className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No upcoming refills. Your medication schedule will appear here once we
          have enough purchase history.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      {sorted.map((item) => (
        <RefillItemCard key={item.id} item={item} />
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4 safe-area-bottom">
        <button
          type="button"
          onClick={() => {
            trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.FIND_PHARMACY_TAP)
            navigate("/patients/care-companion/pharmacy-stock")
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
        >
          <MapPin className="h-4 w-4" />
          Find Pharmacy
        </button>
      </div>
    </div>
  )
}
