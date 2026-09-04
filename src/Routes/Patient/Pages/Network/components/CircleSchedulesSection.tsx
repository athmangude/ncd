import { useNavigate } from "react-router-dom"
import { Pill, FlaskConical, Clock, Gift, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"
import {
  useCircleSchedules,
  type CircleScheduleEvent,
} from "../hooks/useCircleSchedules"
import type { RefillStatus } from "@/types/care-companion"

function StatusBadge({ status }: { status: RefillStatus }) {
  const config: Record<string, { label: string; className: string }> = {
    OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-700" },
    DUE: { label: "Due soon", className: "bg-amber-100 text-amber-700" },
    UPCOMING: {
      label: "Upcoming",
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

function DaysLabel({ days }: { days: number }) {
  if (days < 0) {
    const overdue = Math.abs(days)
    return (
      <span className="text-xs text-red-600">
        {overdue} {overdue === 1 ? "day" : "days"} overdue
      </span>
    )
  }
  if (days === 0) {
    return <span className="text-xs text-amber-600">Due today</span>
  }
  return (
    <span className="text-xs text-muted-foreground">
      In {days} {days === 1 ? "day" : "days"}
    </span>
  )
}

function ScheduleEventCard({ event }: { event: CircleScheduleEvent }) {
  const navigate = useNavigate()
  const Icon = event.type === "MEDICATION" ? Pill : FlaskConical

  const handleShareCashback = () => {
    trackEvent(EVENTS.CIRCLE.CIRCLE_SCHEDULE_SHARE_CASHBACK_TAPPED, {
      memberId: event.memberId,
      eventType: event.type,
      eventName: event.name,
    })
    navigate("/patients/care-fund/gift-recipient", {
      state: { preselectedPatientId: event.memberId },
    })
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3.5",
        event.status === "OVERDUE" && "border-red-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              event.type === "MEDICATION"
                ? event.status === "OVERDUE"
                  ? "bg-red-100 text-red-600"
                  : event.status === "DUE"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-primary/10 text-primary"
                : event.status === "OVERDUE"
                  ? "bg-red-100 text-red-600"
                  : event.status === "DUE"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-50 text-blue-600",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {event.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {event.isSelf ? "You" : `${event.memberFirstName} ${event.memberLastName}`}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              <DaysLabel days={event.daysUntil} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={event.status} />
          {event.cost > 0 && (
            <p className="text-xs font-semibold font-mono text-foreground">
              KES {event.cost.toLocaleString()}
            </p>
          )}
        </div>
      </div>
      {!event.isSelf && (
        <button
          type="button"
          onClick={handleShareCashback}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors active:bg-primary/20"
        >
          <Gift className="h-3.5 w-3.5" />
          Share cashback
        </button>
      )}
    </div>
  )
}

export function CircleSchedulesSection() {
  const { data: events, isLoading } = useCircleSchedules()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-36 rounded bg-muted" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-3.5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
            <div className="mt-2.5 h-8 w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center">
        <Calendar className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No upcoming schedules for your circle members yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Circle member schedules
        </p>
      </div>
      {events.map((event) => (
        <ScheduleEventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
