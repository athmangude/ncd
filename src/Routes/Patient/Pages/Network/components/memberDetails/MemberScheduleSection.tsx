import { Pill, FlaskConical, Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemberSchedules } from "../../hooks/useCircleSchedules"
import type { CircleScheduleEvent } from "../../hooks/useCircleSchedules"
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

function ScheduleItem({ event }: { event: CircleScheduleEvent }) {
  const Icon = event.type === "MEDICATION" ? Pill : FlaskConical
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border bg-card p-3",
        event.status === "OVERDUE" && "border-red-200",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
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
          <p className="text-sm font-medium text-foreground truncate">
            {event.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
            <DaysLabel days={event.daysUntil} />
          </div>
          {event.cost > 0 && (
            <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
              KES {event.cost.toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <StatusBadge status={event.status} />
    </div>
  )
}

interface MemberScheduleSectionProps {
  phoneNumber: string | null
  firstName: string
}

export function MemberScheduleSection({
  phoneNumber,
  firstName,
}: MemberScheduleSectionProps) {
  const { data, isLoading } = useMemberSchedules(phoneNumber)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-14 w-full rounded-lg bg-muted" />
        <div className="h-14 w-full rounded-lg bg-muted" />
      </div>
    )
  }

  const refills = data?.refills ?? []
  const tests = data?.tests ?? []

  if (refills.length === 0 && tests.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {firstName}&apos;s upcoming schedule
        </p>
      </div>

      {refills.length > 0 && (
        <div className="flex flex-col gap-2">
          {refills.map((event) => (
            <ScheduleItem key={event.id} event={event} />
          ))}
        </div>
      )}

      {tests.length > 0 && (
        <div className="flex flex-col gap-2">
          {tests.map((event) => (
            <ScheduleItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
