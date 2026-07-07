// Service Worker Registration Utility
import { useState, useEffect } from "react"
import { Button } from "@/components/Button"

// Check if service workers are supported
export const isServiceWorkerSupported = "serviceWorker" in navigator

// Register the service worker
// eslint-disable-next-line react-refresh/only-export-components
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported) {
    console.warn("Service workers are not supported in this browser")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")
    console.log("Service Worker registered successfully:", registration.scope)
    return registration
  } catch (error) {
    console.error("Service Worker registration failed:", error)
    return null
  }
}

// Unregister all service workers
// eslint-disable-next-line react-refresh/only-export-components
export async function unregisterServiceWorkers(): Promise<boolean> {
  if (!isServiceWorkerSupported) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
      return true
    }
    return false
  } catch (error) {
    console.error("Service Worker unregistration failed:", error)
    return false
  }
}

// React hook for handling service worker registration
// eslint-disable-next-line react-refresh/only-export-components
export function useServiceWorker() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!isServiceWorkerSupported) {
      return
    }

    // Function to handle updates
    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      // When a service worker update is found
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener("statechange", () => {
          // When the service worker is installed and waiting
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setIsUpdateAvailable(true)
            setWaitingWorker(newWorker)
          }
        })
      })
    }

    // Register the service worker
    registerServiceWorker().then((reg) => {
      if (reg) {
        setRegistration(reg)
        handleUpdate(reg)

        // Check if there's already a waiting worker
        if (reg.waiting && navigator.serviceWorker.controller) {
          setIsUpdateAvailable(true)
          setWaitingWorker(reg.waiting)
        }
      }
    })

    // Handle controller changes
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Function to update the service worker
  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
    }
  }

  return {
    registration,
    isUpdateAvailable,
    updateServiceWorker,
  }
}

// Component to display an update notification
export function ServiceWorkerUpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker()

  if (!isUpdateAvailable) {
    return null
  }

  return (
    <div className="fixed bottom-0 right-0 m-4 p-4 bg-black text-white rounded-lg shadow-lg z-50">
      <p>New version available!</p>
      <Button size="sm" onClick={updateServiceWorker} className="mt-2">
        Update Now
      </Button>
    </div>
  )
}

// Listen for messages from the service worker
// eslint-disable-next-line react-refresh/only-export-components
export function setupServiceWorkerMessageListener(
  callback: (event: MessageEvent) => void
) {
  if (isServiceWorkerSupported) {
    navigator.serviceWorker.addEventListener("message", callback)
    return () =>
      navigator.serviceWorker.removeEventListener("message", callback)
  }
  return () => {} // No-op cleanup function if service workers aren't supported
}

// Send a message to the service worker
// eslint-disable-next-line react-refresh/only-export-components
export function sendMessageToServiceWorker(
  message: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!isServiceWorkerSupported || !navigator.serviceWorker.controller) {
      reject("Service Worker not available")
      return
    }

    // Create a unique ID for this message
    const messageId = Date.now().toString()
    const messageChannel = new MessageChannel()

    // Set up the response handler
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data)
    }

    // Send the message
    navigator.serviceWorker.controller.postMessage(
      {
        ...message,
        messageId,
      },
      [messageChannel.port2]
    )
  })
}
