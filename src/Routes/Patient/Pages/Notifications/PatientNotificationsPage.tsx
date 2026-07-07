import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Settings, Check, Copy } from "lucide-react"
import { Button } from "@/components/Button"
import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { NotificationHelpDialog } from "@/components/EnableNotificationsCard"
import axios from "axios"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import {
  CircleInviteReminderCard,
  type CircleInviteSubType,
} from "./CircleInviteReminderCard"

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

export default function PatientNotificationsPage() {
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "CIRCLE" | "LOANS" | "SAVINGS"
  >("ALL")
  const { toast } = useToast()
  const {
    notificationPermission,
    requestPermission,
    error: permissionError,
  } = usePushNotifications(user?.id, "PATIENT")

  useEffect(() => {
    if (permissionError) {
      setShowHelp(true)
    }
  }, [permissionError])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/notifications`
        )
        setNotifications(response.data.notifications)
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

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    const previousNotifications = [...notifications]
    const updatedNotifications = notifications.map((n) => ({
      ...n,
      readStatus: "READ" as const,
    }))
    setNotifications(updatedNotifications)

    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/read-all`
      )
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

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "ALL") return true
    return n.type === activeFilter
  })

  // State A: Permission not granted
  if (notificationPermission !== "granted") {
    return (
      <MobileWrapper
        header={
          <BackTitleHeader title="Notifications" onBack={() => navigate(-1)} />
        }
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
        className="flex flex-col items-center justify-center text-center"
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

        <div className="w-full space-y-4 text-left bg-white rounded-xl">
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
      </MobileWrapper>
    )
  }

  if (isLoading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <MobileWrapper
        header={
          <BackTitleHeader title="Notifications" onBack={() => navigate(-1)} />
        }
        footer={null}
      >
        <ErrorBlock message={error} />
      </MobileWrapper>
    )
  }

  // State B: Empty State
  if (notifications.length === 0) {
    return (
      <MobileWrapper
        header={
          <BackTitleHeader
            title="Notifications (0)"
            onBack={() => navigate(-1)}
          />
        }
        footer={null}
        className="flex flex-col items-center justify-center text-center"
      >
        <div className="mb-6 relative">
          <Bell className="w-16 h-16 text-muted-foreground stroke-1" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-border rounded-full" />
        </div>
        <h2 className="mb-2">You have no notifications yet</h2>
        <p className="text-muted-foreground">
          Notifications you get will appear here
        </p>
      </MobileWrapper>
    )
  }

  // State C: List State
  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title={`Notifications (${notifications.length})`}
          onBack={() => navigate(-1)}
        />
      }
      footer={
        <div className="border-t bg-white dark:bg-neutral-950 flex items-center p-4">
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
      className="p-0"
    >
      <div className="px-4 py-4 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-2">
          <Button
            variant={activeFilter === "ALL" ? "default" : "ghost"}
            className={
              activeFilter === "ALL"
                ? "rounded-full bg-primary hover:bg-primary/90 text-white px-6"
                : "rounded-full bg-muted hover:bg-border text-foreground px-6"
            }
            onClick={() => setActiveFilter("ALL")}
          >
            All
          </Button>
          <Button
            variant={activeFilter === "CIRCLE" ? "default" : "ghost"}
            className={
              activeFilter === "CIRCLE"
                ? "rounded-full bg-primary hover:bg-primary/90 text-white px-6"
                : "rounded-full bg-muted hover:bg-border text-foreground px-6"
            }
            onClick={() => setActiveFilter("CIRCLE")}
          >
            Circle
          </Button>
          <Button
            variant={activeFilter === "LOANS" ? "default" : "ghost"}
            className={
              activeFilter === "LOANS"
                ? "rounded-full bg-primary hover:bg-primary/90 text-white px-6"
                : "rounded-full bg-muted hover:bg-border text-foreground px-6"
            }
            onClick={() => setActiveFilter("LOANS")}
          >
            Loan
          </Button>
          <Button
            variant={activeFilter === "SAVINGS" ? "default" : "ghost"}
            className={
              activeFilter === "SAVINGS"
                ? "rounded-full bg-primary hover:bg-primary/90 text-white px-6"
                : "rounded-full bg-muted hover:bg-border text-foreground px-6"
            }
            onClick={() => setActiveFilter("SAVINGS")}
          >
            Savings
          </Button>
        </div>
      </div>

      <div>
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
            <p>No notifications found in this category.</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const isCircleReminder =
              notification.notificationSubType === "CIRCLE_INVITE_4H_OWNER" ||
              notification.notificationSubType === "CIRCLE_INVITE_24H_OWNER"

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
                    inviteeFirstName={notification.metadata.inviteeFirstName}
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
                  notification.readStatus === "UNREAD" ? "bg-blue-50/30" : ""
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
                        : "text-foreground"
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
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>
    </MobileWrapper>
  )
}
