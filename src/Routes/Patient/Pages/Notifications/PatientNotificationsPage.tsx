import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Settings, Check, Copy, Sparkles } from "lucide-react"
import { Button } from "@/components/Button"
import PatientPageWrapper from "../PatientPageWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { NotificationHelpDialog } from "@/components/EnableNotificationsCard"
import { supabase } from "@/lib/supabase"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import {
  CircleInviteReminderCard,
  type CircleInviteSubType,
} from "./CircleInviteReminderCard"
import {
  useNotifications as useCareNotifications,
  useMarkNotificationRead,
} from "@/Routes/Patient/Pages/CareCompanion/hooks/useNotifications"
import type { CareCompanionNotification } from "@/types/care-companion"

const COMPANION_TYPE_LABELS: Record<string, string> = {
  REFILL_NUDGE: "Refill Reminder",
  MISSED_TEST_FLAG: "Lab Test",
  COST_SAVING_SUGGESTION: "Cost Saving",
  DRUG_INTERACTION_WARNING: "Drug Interaction",
  PROVIDER_FLAG: "Attention",
  ADHERENCE_PATTERN: "Adherence",
  CIRCLE_PROMPT: "Circle",
  DRUG_INFO_SURFACE: "Drug Info",
  TEST_RESULT_PROMPT: "Test Results",
  JIREH_PLUS_RECOMMEND: "Jireh Plus",
  LOAN_REPAYMENT_PRAISE: "Repayment",
  LOAN_REPAYMENT_REMINDER: "Due Soon",
  LOAN_REPAYMENT_OVERDUE: "Overdue",
  LOAN_OFFER: "Loan Offer",
  REFILL_REMINDER: "Refill Reminder",
  REFILL_OVERDUE: "Refill Overdue",
  REFILL_LOAN_OFFER: "Loan Offer",
  PREDICTIVE_CREDIT_OFFER: "Credit Offer",
  EDUCATION_WEEKLY: "Education",
  MEDICATION_CARD_AVAILABLE: "Medication Info",
  LAB_REMINDER: "Lab Test",
}

function getCompanionTypeLabel(n: CareCompanionNotification): string {
  if (n.type === "AI_INSIGHT" && n.metadata?.actionType) {
    return COMPANION_TYPE_LABELS[n.metadata.actionType] ?? "AI Insight"
  }
  return COMPANION_TYPE_LABELS[n.type] ?? n.type
}

interface Notification {
  id: number
  patientId: string
  phoneNumber: string
  message: string
  type: "LOANS" | "SAVINGS" | "CIRCLE" | "OTHER"
  status: string
  readStatus: "READ" | "UNREAD"
  sentAt: string
  notificationSubType?: string | null
  relatedEntityId?: string | null
  metadata?: { inviteeFirstName?: string } | null
}

type FilterType = "ALL" | "CIRCLE" | "LOANS" | "SAVINGS" | "COMPANION"

type DisplayItem =
  | { source: "general"; data: Notification }
  | { source: "companion"; data: CareCompanionNotification }

export default function PatientNotificationsPage() {
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL")
  const { toast } = useToast()
  const {
    notificationPermission,
    requestPermission,
    error: permissionError,
  } = usePushNotifications(user?.id, "PATIENT")

  const { data: careNotifications = [], isLoading: careLoading } =
    useCareNotifications()
  const markCareReadMutation = useMarkNotificationRead()

  const sentCareNotifications = useMemo(
    () => careNotifications.filter((n) => n.sentAt !== null),
    [careNotifications],
  )

  useEffect(() => {
    if (permissionError) {
      setShowHelp(true)
    }
  }, [permissionError])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true)
        const { data, error: fetchError } = await supabase
          .from("notifications")
          .select("*")
          .order("sent_at", { ascending: false })

        if (fetchError) throw fetchError

        setNotifications(
          (data ?? []).map((row: Record<string, unknown>) => ({
            ...row,
            deepLink: row.deep_link,
            readAt: row.read_at,
            sentAt: row.sent_at,
            readStatus: row.read_at ? "READ" : "UNREAD",
          })) as unknown as Notification[],
        )
      } catch (err: any) {
        console.error("Error fetching notifications:", err)
        setError(err.message || "Failed to load notifications")
      } finally {
        setIsLoading(false)
      }
    }

    if (notificationPermission === "granted") {
      fetchNotifications()
    } else {
      setIsLoading(false)
    }
  }, [notificationPermission])

  const handleEnableNotifications = async () => {
    setIsRequesting(true)
    try {
      await requestPermission()
    } catch (err) {
      console.error("Error requesting permission:", err)
    } finally {
      setIsRequesting(false)
    }
  }

  const displayItems: DisplayItem[] = useMemo(() => {
    const items: DisplayItem[] = [
      ...notifications.map(
        (n): DisplayItem => ({ source: "general", data: n }),
      ),
      ...sentCareNotifications.map(
        (n): DisplayItem => ({ source: "companion", data: n }),
      ),
    ]
    items.sort(
      (a, b) =>
        new Date(b.data.sentAt ?? 0).getTime() -
        new Date(a.data.sentAt ?? 0).getTime(),
    )
    return items
  }, [notifications, sentCareNotifications])

  const filteredItems = useMemo(() => {
    if (activeFilter === "ALL") return displayItems
    if (activeFilter === "COMPANION")
      return displayItems.filter((item) => item.source === "companion")
    return displayItems.filter(
      (item) =>
        item.source === "general" && item.data.type === activeFilter,
    )
  }, [displayItems, activeFilter])

  const handleMarkAllAsRead = async () => {
    const previousNotifications = [...notifications]
    setNotifications(
      notifications.map((n) => ({ ...n, readStatus: "READ" as const })),
    )

    for (const n of sentCareNotifications) {
      if (!n.readAt) {
        markCareReadMutation.mutate(n.id)
      }
    }

    try {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null)
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (err) {
      console.error("Error marking all as read:", err)
      setNotifications(previousNotifications)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  }

  const extractUrl = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const match = text.match(urlRegex)
    return match ? match[0] : null
  }

  const handleCopyLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    toast({
      title: "Success",
      description: "Link copied to clipboard!",
    })
  }

  const renderMessageWithLink = (message: string) => {
    const url = extractUrl(message)
    if (!url) return message

    const parts = message.split(url)
    return (
      <>
        {parts[0]}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
        {parts[1]}
      </>
    )
  }

  function handleTapCareNotification(n: CareCompanionNotification) {
    if (!n.readAt) {
      markCareReadMutation.mutate(n.id)
    }
    navigate(`/patients/notifications/${n.id}`)
  }

  // State A: No push permission AND no care notifications to show
  if (
    notificationPermission !== "granted" &&
    sentCareNotifications.length === 0
  ) {
    return (
      <PatientPageWrapper
        title="Notifications"
        onBack={() => navigate(-1)}
        footer={
          notificationPermission === "denied" ? (
            <PrimaryCTAFooter
              label={
                <span className="flex items-center gap-2">
                  Enable in Settings
                  <Settings className="w-5 h-5" />
                </span>
              }
              onClick={() => setShowHelp(true)}
            />
          ) : (
            <PrimaryCTAFooter
              label={
                <span className="flex items-center gap-2">
                  {isRequesting ? "Enabling..." : "Enable updates"}
                  {!isRequesting && <Bell className="w-5 h-5" />}
                </span>
              }
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              isLoading={isRequesting}
            />
          )
        }
        className="flex flex-col items-center justify-center text-center min-h-full"
      >
        <div className="mb-6 relative">
          <Bell className="w-16 h-16 text-muted-foreground stroke-1" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-border rounded-full" />
        </div>

        <h2 className="mb-3">Stay in the loop</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Turn on notifications to get instant alerts for payments, loan
          approvals, and important care reminders.
        </p>

        <div className="w-full space-y-4 text-left bg-card rounded-xl">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm font-medium text-foreground">
              Keep SMS for urgent alerts
            </span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm font-medium text-foreground">
              Keep track of every transaction
            </span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm font-medium text-foreground">
              Get progress reminders and reports
            </span>
          </div>
        </div>

        <NotificationHelpDialog open={showHelp} onOpenChange={setShowHelp} />
      </PatientPageWrapper>
    )
  }

  if (isLoading || careLoading) {
    return <LoadingPage />
  }

  if (error && sentCareNotifications.length === 0) {
    return (
      <PatientPageWrapper
        title="Notifications"
        onBack={() => navigate(-1)}
        footer={null}
      >
        <ErrorBlock message={error} />
      </PatientPageWrapper>
    )
  }

  // State B: Empty State
  if (displayItems.length === 0) {
    return (
      <PatientPageWrapper
        title="Notifications (0)"
        onBack={() => navigate(-1)}
        footer={null}
        className="flex flex-col items-center justify-center text-center min-h-full"
      >
        <div className="mb-6 relative">
          <Bell className="w-16 h-16 text-muted-foreground stroke-1" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-border rounded-full" />
        </div>
        <h2 className="mb-2">You have no notifications yet</h2>
        <p className="text-muted-foreground">
          Notifications you get will appear here
        </p>
      </PatientPageWrapper>
    )
  }

  // State C: List State
  return (
    <PatientPageWrapper
      title={`Notifications (${displayItems.length})`}
      onBack={() => navigate(-1)}
      footer={
        <div className="border-t bg-card dark:bg-neutral-950 flex items-center p-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        </div>
      }
      bodyPadding="none"
      className="p-0"
    >
      <div className="px-4 py-4 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-2">
          {(
            [
              { key: "ALL", label: "All" },
              { key: "COMPANION", label: "Companion" },
              { key: "CIRCLE", label: "Circle" },
              { key: "LOANS", label: "Loan" },
              { key: "SAVINGS", label: "Savings" },
            ] as const
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant={activeFilter === key ? "default" : "ghost"}
              className={
                activeFilter === key
                  ? "rounded-full bg-primary hover:bg-primary/90 text-white px-6"
                  : "rounded-full bg-muted hover:bg-border text-foreground px-6"
              }
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
            <p>No notifications found in this category.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            if (item.source === "companion") {
              const n = item.data
              const isUnread = n.readAt === null
              return (
                <button
                  key={`care-${n.id}`}
                  type="button"
                  onClick={() => handleTapCareNotification(n)}
                  className={cn(
                    "flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted active:bg-muted/60",
                    isUnread && "bg-blue-50/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-2 h-2 w-2 shrink-0 rounded-full",
                      isUnread ? "bg-primary" : "bg-transparent",
                    )}
                    aria-hidden
                  />
                  <div className="flex-1">
                    <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {n.type === "AI_INSIGHT" && (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {getCompanionTypeLabel(n)}
                    </span>
                    <p
                      className={cn(
                        "mt-0.5 text-sm",
                        isUnread
                          ? "font-medium text-foreground"
                          : "text-foreground",
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(n.sentAt!)}
                    </p>
                  </div>
                </button>
              )
            }

            const notification = item.data
            const isCircleReminder =
              notification.notificationSubType ===
                "CIRCLE_INVITE_4H_OWNER" ||
              notification.notificationSubType ===
                "CIRCLE_INVITE_24H_OWNER"

            if (
              isCircleReminder &&
              notification.relatedEntityId &&
              notification.metadata?.inviteeFirstName
            ) {
              return (
                <div key={notification.id} className="px-4 py-2">
                  <CircleInviteReminderCard
                    subType={
                      notification.notificationSubType as CircleInviteSubType
                    }
                    invitationId={notification.relatedEntityId}
                    inviteeFirstName={
                      notification.metadata.inviteeFirstName
                    }
                    sentAt={notification.sentAt}
                    readStatus={notification.readStatus}
                  />
                </div>
              )
            }

            const url = extractUrl(notification.message)
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 hover:bg-muted transition-colors cursor-pointer group relative",
                  notification.readStatus === "UNREAD" ? "bg-blue-50/30" : "",
                )}
              >
                {notification.readStatus === "UNREAD" && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
                {notification.readStatus === "READ" && (
                  <div className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0" />
                )}

                <div className="flex-1 pr-8">
                  <p
                    className={cn(
                      "text-sm",
                      notification.readStatus === "UNREAD"
                        ? "font-medium text-foreground"
                        : "text-foreground",
                    )}
                  >
                    {renderMessageWithLink(notification.message)}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {formatDate(notification.sentAt)}
                  </p>
                </div>

                {url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleCopyLink(e, url)}
                    title="Copy link"
                    aria-label="Copy link"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>
    </PatientPageWrapper>
  )
}
