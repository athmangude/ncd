import { useState, useEffect } from "react"

/**
 * Standalone prototype stub for push notifications.
 *
 * The real hook registered an FCM device token with the backend via Firebase
 * Cloud Messaging. For the offline prototype there is no backend and no
 * Firebase, so this keeps the same public API but only drives the browser's
 * native Notification permission state. registerDevice / unregisterDevice are
 * no-ops, so the permission-related UI journeys still work.
 */
export const usePushNotifications = (_userId?: string, _userType?: string) => {
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(
      typeof Notification !== "undefined" ? Notification.permission : "default"
    )
  const [fcmToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof Notification === "undefined") return "denied"
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission
    } catch (err) {
      console.error("Error requesting notification permission:", err)
      setError("Failed to request notification permission")
      return "denied"
    }
  }

  // No backend to register/unregister against in the prototype.
  const registerDevice = async () => {}
  const unregisterDevice = async () => {}

  // Keep permission state in sync if the user changes it in browser settings.
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined")
      return

    const checkPermission = () => {
      const current = Notification.permission
      setNotificationPermission((prev) => (current !== prev ? current : prev))
    }

    window.addEventListener("focus", checkPermission)
    const interval = setInterval(checkPermission, 5000)

    return () => {
      window.removeEventListener("focus", checkPermission)
      clearInterval(interval)
    }
  }, [])

  return {
    notificationPermission,
    fcmToken,
    error,
    requestPermission,
    registerDevice,
    unregisterDevice,
  }
}
