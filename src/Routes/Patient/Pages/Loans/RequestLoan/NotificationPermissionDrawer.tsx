import { useState, useRef, useCallback } from "react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { Button } from "@/components/Button"
import { Loader2, Settings, Bell, Clock2, Check } from "lucide-react"

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationFlow(userId: string | undefined) {
  const { notificationPermission, requestPermission } = usePushNotifications(
    userId,
    "PATIENT"
  )
  const [isOpen, setIsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  const onProceedRef = useRef<(() => void) | null>(null)

  const checkAndProceed = useCallback(
    (onProceed: () => void) => {
      // If permission is already granted, just proceed
      if (notificationPermission === "granted") {
        onProceed()
        return
      }

      // Store the callback to execute after permission handling
      onProceedRef.current = onProceed

      if (notificationPermission === "default") {
        setShowHelp(false)
        setIsOpen(true)
        return
      }

      if (notificationPermission === "denied") {
        setShowHelp(true)
        setIsOpen(true)
        return
      }
    },
    [notificationPermission]
  )

  const handleEnable = async () => {
    setIsRequesting(true)
    try {
      const result = await requestPermission()
      if (result === "granted") {
        setIsOpen(false)
        if (onProceedRef.current) {
          onProceedRef.current()
        }
      } else {
        // If denied or dismissed, show help instructions
        setShowHelp(true)
      }
    } catch (e) {
      console.error(e)
      // Show help on error (e.g. incognito mode often blocks push API)
      setShowHelp(true)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleSkip = () => {
    setIsOpen(false)
    if (onProceedRef.current) {
      onProceedRef.current()
    }
  }

  const close = () => setIsOpen(false)

  return {
    isOpen,
    showHelp,
    isRequesting,
    checkAndProceed,
    handleEnable,
    handleSkip,
    close,
  }
}

interface NotificationPermissionDrawerProps {
  isOpen: boolean
  onClose: () => void
  onEnable: () => void
  onSkip: () => void
  isRequesting: boolean
  showHelp: boolean
}

export function NotificationPermissionDrawer({
  isOpen,
  onClose,
  onEnable,
  onSkip,
  isRequesting,
  showHelp,
}: NotificationPermissionDrawerProps) {
  if (showHelp) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Notifications are blocked</DrawerTitle>
            <DrawerDescription>
              We couldn't enable notifications. This might be because you are in
              Incognito mode or have blocked notifications.
            </DrawerDescription>
          </DrawerHeader>

          <div className="py-6">
            <div className="space-y-4 text-sm">
              <p className="font-medium text-foreground">
                To enable notifications:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">
                      Open browser settings
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Go to Settings {">"} Site settings {">"} Notifications
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">
                      Allow notifications for Jireh
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Find Jireh and change permission to "Allow"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0">
                    <Clock2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">
                      Refresh the page
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reload this page to apply changes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="gap-3">
            <Button variant="outline" className="w-full" onClick={onSkip}>
              Continue without notifications
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Stay in the loop</DrawerTitle>
          <DrawerDescription>
            Turn on notifications to get instant alerts for payments, loan
            approvals, and important care reminders.
          </DrawerDescription>
        </DrawerHeader>

        <div className="py-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 ">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium text-sm">
                Keep SMS for urgent alerts
              </span>
            </div>
            <div className="flex items-center gap-3 ">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium text-sm">
                Keep track of every transaction
              </span>
            </div>
            <div className="flex items-center gap-3 ">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium text-sm">
                Get progress reminders and reports
              </span>
            </div>
          </div>
        </div>

        <DrawerFooter className="gap-3">
          <div className="flex gap-4 w-full">
            <Button variant="secondary" onClick={onSkip}>
              Skip
            </Button>
            <Button
              className="w-full "
              onClick={onEnable}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  {" "}
                  <Bell className="w-4 h-4 mr-2" /> Enable updates
                </>
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
