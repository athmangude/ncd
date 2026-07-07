import { useEffect, useState } from "react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { useSendTestNotification } from "@/hooks/useSendTestNotification"
import { Menu, MenuTrigger, MenuContent } from "@/components/Menu"
import { Button } from "./Button"
import { Bell, BellOff } from "lucide-react"
import { Label } from "./Label"
import { Switch } from "./Switch"

export default function PushSettings() {
  const [open, setOpen] = useState(false)
  const user = usePatientAuthStore((state: any) => state.user)
  const userType: string = "PATIENT"
  const defaultTitle = `Hello ${user?.firstName ? user.firstName : "there"}`
  const defaultBody = "Welcome to Jireh Health"
  const canSend = Boolean(user?.id)

  const { notificationPermission, requestPermission, registerDevice } =
    usePushNotifications(user?.id, userType)

  const {
    sendNotification,
    isSending,
    success: sendSuccess,
    reset: resetSendStatus,
  } = useSendTestNotification()

  const [enabled, setEnabled] = useState(notificationPermission === "granted")

  // Keep toggle in sync with actual permission
  useEffect(() => {
    setEnabled(notificationPermission === "granted")
  }, [notificationPermission])

  const handleEnableNotifications = async (checked: boolean) => {
    if (checked && notificationPermission === "default") {
      await requestPermission()
    }
    setEnabled(checked)
  }

  const handleSendTestNotification = async () => {
    resetSendStatus()
    // Ensure device is registered right before sending (covers first-time grant without refresh)
    if (notificationPermission === "granted") {
      try {
        await registerDevice()
      } catch {
        // Already-registered or transient failure — proceed with the send attempt
      }
    }
    await sendNotification({
      userId: user?.id,
      userType,
      title: defaultTitle,
      body: defaultBody,
    })
  }

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (sendSuccess) {
      const timer = setTimeout(() => {
        resetSendStatus()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [sendSuccess, resetSendStatus])
  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          {notificationPermission === "granted" ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {sendSuccess && (
            <span className="absolute top-1 right-1 inline-block h-2 w-2 rounded-full bg-green-500" />
          )}
        </Button>
      </MenuTrigger>

      <MenuContent className="w-[calc(100vw-2rem)] sm:w-96 max-w-md">
        <div className="space-y-4">
          {/* Enable Notifications Toggle */}
          <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <Label className="font-medium text-sm">
                {notificationPermission === "granted"
                  ? "Notifications enabled"
                  : notificationPermission === "denied"
                    ? "Notifications blocked"
                    : "Enable notifications"}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {notificationPermission === "granted"
                  ? "You'll receive notifications on this device."
                  : notificationPermission === "denied"
                    ? "Turn them on in your browser settings."
                    : "Allow to start receiving messages."}
              </p>
            </div>
            <Switch //Enable Notifications Switch
              checked={enabled}
              onCheckedChange={handleEnableNotifications}
              disabled
              className="shrink-0"
            />
          </div>

          {/* Send Test Button */}
          <Button
            className="w-full"
            onClick={handleSendTestNotification}
            disabled={
              !canSend || isSending || notificationPermission === "denied"
            }
            title={
              !canSend
                ? "You must be logged in to send a notification."
                : notificationPermission === "denied"
                  ? "Notifications are blocked in your browser settings."
                  : undefined
            }
          >
            {isSending ? "Sending…" : "Send Notification"}
          </Button>
        </div>
      </MenuContent>
    </Menu>
  )
}
