import { useNavigate } from "react-router-dom"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/Skeleton"
import ErrorBlock from "@/components/ErrorBlock"
import { Button } from "@/components/Button"
import PatientPageWrapper from "@/Routes/Patient/Pages/PatientPageWrapper"
import type { CareCompanionNotification } from "@/types/care-companion"
import {
  useNotifications,
  useMarkNotificationRead,
} from "@/Routes/Patient/Pages/CareCompanion/hooks/useNotifications"

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function groupLabel(scheduledAt: string): "Today" | "Yesterday" | "Earlier" {
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = todayStart - 86_400_000
  const notifDay = startOfDay(new Date(scheduledAt))

  if (notifDay >= todayStart) return "Today"
  if (notifDay >= yesterdayStart) return "Yesterday"
  return "Earlier"
}

interface NotificationGroup {
  label: "Today" | "Yesterday" | "Earlier"
  items: CareCompanionNotification[]
}

function groupNotifications(
  notifications: CareCompanionNotification[]
): NotificationGroup[] {
  const groups: Record<string, CareCompanionNotification[]> = {}

  for (const n of notifications) {
    const label = groupLabel(n.scheduledAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }

  const order: NotificationGroup["label"][] = ["Today", "Yesterday", "Earlier"]

  return order
    .filter((label) => groups[label]?.length)
    .map((label) => ({ label, items: groups[label] }))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      {[1, 2, 3].map((group) => (
        <div key={group} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          {[1, 2].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-md border border-border p-4"
            >
              <Skeleton className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <Bell className="h-8 w-8 text-accent-foreground" aria-hidden />
      </div>
      <h2>No notifications yet</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        When you have refill reminders, education tips, or loan offers they will
        appear here.
      </p>
    </div>
  )
}

function NotificationCard({
  notification,
  onTap,
}: {
  notification: CareCompanionNotification
  onTap: (n: CareCompanionNotification) => void
}) {
  const isUnread = notification.readAt === null

  return (
    <button
      type="button"
      onClick={() => onTap(notification)}
      aria-label={
        isUnread ? `Unread: ${notification.title}` : notification.title
      }
      className={cn(
        "flex w-full items-start gap-3 rounded-md border border-border p-4 text-left",
        "transition-colors active:bg-muted/60",
        isUnread && "bg-accent/30"
      )}
    >
      {/* Teal unread dot */}
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          isUnread ? "bg-accent-foreground" : "bg-transparent"
        )}
        aria-hidden
      />

      <div className="flex flex-1 flex-col gap-1">
        {isUnread && <span className="sr-only">Unread.</span>}
        <span
          className={cn(
            "text-sm leading-snug",
            isUnread
              ? "font-semibold text-foreground"
              : "font-medium text-foreground"
          )}
        >
          {notification.title}
        </span>
        <span className="line-clamp-2 text-xs text-muted-foreground">
          {notification.body}
        </span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NotificationFeedPage() {
  const navigate = useNavigate()

  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useNotifications()

  const markReadMutation = useMarkNotificationRead()

  function handleTap(notification: CareCompanionNotification) {
    // Fire mark-read in background; navigate immediately regardless of
    // network outcome (spec: "notification still navigates but dot remains"
    // on error).
    if (notification.readAt === null) {
      markReadMutation.mutate(notification.id)
    }
    navigate(notification.deepLink)
  }

  // -- Loading state -------------------------------------------------------
  if (isLoading) {
    return (
      <PatientPageWrapper title="Notifications" onBack={() => navigate(-1)}>
        <NotificationSkeleton />
      </PatientPageWrapper>
    )
  }

  // -- Error state --------------------------------------------------------
  if (isError) {
    return (
      <PatientPageWrapper title="Notifications" onBack={() => navigate(-1)}>
        <ErrorBlock
          message="We couldn't load your notifications. Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      </PatientPageWrapper>
    )
  }

  // Filter out notifications that have not been sent yet
  // (sentAt === null means scheduled but not yet delivered).
  const sent = notifications?.filter((n) => n.sentAt !== null)

  // -- Empty state --------------------------------------------------------
  if (!sent || sent.length === 0) {
    return (
      <PatientPageWrapper title="Notifications" onBack={() => navigate(-1)}>
        <EmptyState />
      </PatientPageWrapper>
    )
  }

  // -- Grouped feed -------------------------------------------------------
  const groups = groupNotifications(sent)

  return (
    <PatientPageWrapper
      title="Notifications"
      onBack={() => navigate(-1)}
      bodyPadding="none"
    >
      <div className="flex flex-col gap-6 p-4 pb-tabbar">
        {groups.map((group) => (
          <section
            key={group.label}
            aria-label={`${group.label} notifications`}
          >
            <h2 className="mb-3 text-muted-foreground">{group.label}</h2>
            <div className="flex flex-col gap-2">
              {group.items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onTap={handleTap}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PatientPageWrapper>
  )
}
