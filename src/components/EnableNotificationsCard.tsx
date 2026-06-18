import { useState, useEffect } from "react"
import { Bell, Settings, Gift, CreditCard, Clock } from "lucide-react"
import { Button } from "./Button"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./Dialog"

export default function EnableNotificationsCard() {
  const user = usePatientAuthStore((state: any) => state.user)
  const userType: string = "PATIENT"
  const [isRequesting, setIsRequesting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showNotificationHelp, setShowNotificationHelp] = useState(false)

  const {
    notificationPermission,
    requestPermission,
    error: permissionError,
  } = usePushNotifications(user?.id, userType)

  // Automatically show help modal when there's a notification error
  useEffect(() => {
    if (permissionError) {
      setShowNotificationHelp(true)
    }
  }, [permissionError])

  // Don't show if permission is already granted
  if (notificationPermission === "granted") {
    return null
  }

  const handleCardClick = () => {
    // Only open dialog if permission is not denied
    if (notificationPermission !== "denied") {
      setIsDialogOpen(true)
    }
  }

  const handleEnableNotifications = async () => {
    setIsRequesting(true)
    try {
      await requestPermission()
      // Close dialog after permission request (granted or denied)
      // This allows the user to see the updated card state
      setIsDialogOpen(false)
    } catch {
      //Error requesting notification permission
      setIsDialogOpen(false)
    } finally {
      setIsRequesting(false)
    }
  }

  const isDenied = notificationPermission === "denied"

  const openBrowserNotificationSettings = () => {
    setShowNotificationHelp(true)
  }

  return (
    <>
      <NotificationCard
        isDenied={isDenied}
        onCardClick={handleCardClick}
        onOpenBrowserNotificationSettings={openBrowserNotificationSettings}
      />

      {/* Benefits Modal */}
      <NotificationBenefitsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onEnableNotifications={handleEnableNotifications}
        isRequesting={isRequesting}
        permissionError={permissionError}
      />

      {/* Fallback Help Modal for Notification Settings */}
      <NotificationHelpDialog
        open={showNotificationHelp}
        onOpenChange={setShowNotificationHelp}
      />
    </>
  )
}

const NotificationCard = ({
  isDenied,
  onCardClick,
  onOpenBrowserNotificationSettings,
}: any) => {
  return (
    <div
      className="w-full rounded-3xl p-5 font-medium bg-gradient-card to-blue-200 from-blue-100 text-neutral-800 grid cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onCardClick()
        }
      }}
      aria-label="Enable notifications"
    >
      <div className="flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-medium">
              Never Miss a Reward
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Get personalised rewards alerts and transaction updates
            </p>
          </div>
        </div>

        {isDenied && (
          <div className="mb-3 flex-1 gap-2 text-xs text-neutral-600 rounded-lg">
            <p>
              Notifications are blocked in your browser. Turn them on in site
              settings.
            </p>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenBrowserNotificationSettings()
                }}
                aria-label="Open browser notification settings"
              >
                Enable Your Notifications
                <Settings className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {!isDenied && (
          <div className="mt-3 flex justify-end">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onCardClick()
              }}
              className="shrink-0"
              aria-label="Turn On Notifications"
            >
              Turn On Notifications
              <Bell className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

const NotificationBenefitsDialog = ({
  open,
  onOpenChange,
  onEnableNotifications,
  isRequesting,
  permissionError,
}: any) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Stay Updated with Jireh
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reward Alerts */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary p-2 shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Reward Alerts</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get notified about new rewards, bonuses, and special offers
              </p>
            </div>
          </div>

          {/* Transaction Updates */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary p-2 shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Transaction Updates</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time alerts for payments, loan disbursements, and account
                activity
              </p>
            </div>
          </div>

          {/* Reminders */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary p-2 shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Payment Reminders</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Never miss a payment with timely reminders and due date alerts
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={onEnableNotifications}
            disabled={isRequesting}
            className="w-full sm:w-auto"
            aria-label="Turn On Notifications"
          >
            {isRequesting ? "Requesting..." : "Turn On Notifications"}
            {!isRequesting && <Bell className="w-4 h-4 ml-2" />}
          </Button>
        </DialogFooter>

        {permissionError && (
          <p className="text-xs text-red-500 mt-2 break-words text-center">
            Error: {permissionError}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export const NotificationHelpDialog = ({ open, onOpenChange }: any) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            How to enable notifications
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <p className="text-xs font-medium tracking-wide text-neutral-500">
            Your browser blocked notifications. Follow these steps to turn them
            back on:
          </p>
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary p-2 shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Open browser settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Go to <span className="font-medium">Settings</span> &gt;{" "}
                  <span className="font-medium">Privacy &amp; security</span>{" "}
                  &gt; <span className="font-medium">Site settings</span> &gt;{" "}
                  <span className="font-medium">Notifications</span>
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary p-2 shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  Allow notifications for Jireh
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  On list of sites, find Jireh and change the permission to{" "}
                  <span className="font-medium">Allow</span>.&nbsp;
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary p-2 shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Refresh the page</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Once you&apos;ve allowed notifications, refresh this page to
                  apply the changes.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
