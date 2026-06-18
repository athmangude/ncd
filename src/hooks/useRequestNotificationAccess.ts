import { useEffect, useState } from "react"

//Used to ask for push notification permissions
export function useNotificationPermission() {
  const [permission, setPermission] = useState(Notification.permission)

  useEffect(() => {
    async function requestPermission() {
      if (permission !== "granted") {
        const result = await Notification.requestPermission()
        setPermission(result)
      }
    }

    requestPermission()
  }, [permission])

  return permission
}
