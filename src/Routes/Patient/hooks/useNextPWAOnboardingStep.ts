import { useState, useEffect } from "react"
import { useLocation, matchPath } from "react-router-dom"

export const PWA_START_URL = "/patients/pwa-setup-intro"

export interface PWAStep {
  id: string
  label: string
  route: string
  description?: string
}

export const PWA_STEP_CONFIG: PWAStep[] = [
  {
    id: "01",
    label: "Install the app",
    route: "/patients/pwa-install",
  },
  {
    id: "02",
    label: "Enable alerts",
    route: "/patients/pwa-notifications",
  },
  {
    id: "03",
    label: "Share your location",
    route: "/patients/pwa-location",
  },
]

export const PWA_STEPS = PWA_STEP_CONFIG.map((step) => step.route)

export function usePWAOnboardingStatus() {
  const [stepStatus, setStepStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkStatus = async () => {
      const status: Record<string, boolean> = {}

      // 1. Install App
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      const isStoredInstalled = localStorage.getItem("pwaInstalled") === "true"
      status["01"] = isStandalone || isStoredInstalled

      // Sync state if standalone is detected
      if (isStandalone && !isStoredInstalled) {
        localStorage.setItem("pwaInstalled", "true")
      }

      // 2. Notifications
      const notificationsGranted =
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      status["02"] = notificationsGranted

      // 3. Location
      let locationGranted = false
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({
            name: "geolocation",
          })
          locationGranted = result.state === "granted"
        }
      } catch {
        // Fallback or ignore
      }
      status["03"] = locationGranted

      if (mounted) {
        setStepStatus(status)
        setLoading(false)
      }
    }

    checkStatus()

    // Poll for changes
    const interval = setInterval(checkStatus, 2000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { stepStatus, loading }
}

export function getFirstIncompletePWAOnboardingStep(
  stepStatus: Record<string, boolean>
) {
  const firstIncomplete = PWA_STEP_CONFIG.find((step) => !stepStatus[step.id])
  return firstIncomplete ? firstIncomplete.route : "/patients/pwa-success"
}

export default function useNextPWAOnboardingStep() {
  const location = useLocation()
  const { stepStatus, loading } = usePWAOnboardingStatus()

  if (loading) return null

  const isIntroPage = location.pathname === PWA_START_URL

  if (isIntroPage) {
    return getFirstIncompletePWAOnboardingStep(stepStatus)
  }

  const currentStepIndex = PWA_STEP_CONFIG.findIndex((step) =>
    matchPath({ path: step.route, end: true }, location.pathname)
  )

  if (currentStepIndex !== -1) {
    for (let i = currentStepIndex + 1; i < PWA_STEP_CONFIG.length; i++) {
      if (!stepStatus[PWA_STEP_CONFIG[i].id]) {
        return PWA_STEP_CONFIG[i].route
      }
    }

    // If we're at the end of the flow, check if ALL steps are actually complete
    // If any step was skipped (is incomplete), go to dashboard instead of success page
    const allStepsComplete = PWA_STEP_CONFIG.every(
      (step) => stepStatus[step.id]
    )
    return allStepsComplete ? "/patients/pwa-success" : "/patients"
  }

  return undefined
}
