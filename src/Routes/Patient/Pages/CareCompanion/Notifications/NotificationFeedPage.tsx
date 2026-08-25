import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/Skeleton"
import ErrorBlock from "@/components/ErrorBlock"
import { Button } from "@/components/Button"
import type { CareCompanionNotification } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const NOTIFICATIONS_QUERY_KEY = "careCompanionNotifications"

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
  notifications: CareCompanionNotification[],
): NotificationGroup[] {
  const groups: Record<string, CareCompanionNotification[]> = {}

  for (const n of notifications) {
    const label = groupLabel(n.scheduledAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }

  const order: NotificationGroup["label"][] = [
    "Today",
    "Yesterday",
    "Earlier",
  ]

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
  onTap: (notification: CareCompanionNotification) => void
}) {
  const isUnread = notification.readAt === null

  return (
    <button
      type="button"
      onClick={() => onTap(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-md border border-border p-4 text-left",
        "transition-colors active:bg-muted/60",
        isUnread && "bg-accent/30",
      )}
    >
      {/* Teal unread dot */}
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          isUnread ? "bg-accent-foreground" : "bg-transparent",
        )}
        aria-hidden
      />

      <div className="flex flex-1 flex-col gap-1">
        <span
          className={cn(
            "text-sm leading-snug",
            isUnread ? "font-semibold text-foreground" : "font-medium text-foreground",
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
  const queryClient = useQueryClient()

  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/notifications`,
      )
      return response.data as CareCompanionNotification[]
    },
    staleTime: 2 * 60 * 1000,
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/notifications/${id}/read`,
      )
    },
    onMutate: async (id: string) => {
      // Optimistic update: set readAt locally so the teal dot disappears
      // immediately, even before the server responds.
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] })

      const previous = queryClient.getQueryData<CareCompanionNotification[]>([
        NOTIFICATIONS_QUERY_KEY,
      ])

      queryClient.setQueryData<CareCompanionNotification[]>(
        [NOTIFICATIONS_QUERY_KEY],
        (old) =>
          old?.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      // Rollback on failure so the dot reappears (edge case per spec).
      if (context?.previous) {
        queryClient.setQueryData(
          [NOTIFICATIONS_QUERY_KEY],
          context.previous,
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] })
    },
  })

  function handleTap(notification: CareCompanionNotification) {
    // Fire mark-read in background; navigate immediately regardless of
    // network outcome (spec: "notification still navigates but dot remains"
    // on error).
    if (notification.readAt === null) {
      markReadMutation.mutate(notification.id)
    }
    navigate(notification.deepLink)
  }

  // -- Loading state --------------------------------------------------------
  if (isLoading) {
    return <NotificationSkeleton />
  }

  // -- Error state ----------------------------------------------------------
  if (isError) {
    return (
      <ErrorBlock
        message="We couldn't load your notifications. Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  // -- Empty state ----------------------------------------------------------
  if (!notifications || notifications.length === 0) {
    return <EmptyState />
  }

  // -- Grouped feed ---------------------------------------------------------
  const groups = groupNotifications(notifications)

  return (
    <div className="flex flex-col gap-6 p-4 pb-tabbar">
      {groups.map((group) => (
        <section key={group.label} aria-label={`${group.label} notifications`}>
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
  )
}
