import { useState, useEffect, useCallback, useRef } from "react"
import { trackEvent, EVENTS } from "@/analytics"

export enum PromptStatus {
  DISMISSED = "dismissed",
  INSTALLED = "installed",
}

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const isStandaloneMode = () => {
  if (typeof window === "undefined") {
    return false
  }

  const isStandaloneDisplay = window.matchMedia(
    "(display-mode: standalone)"
  ).matches
  const iosStandalone = (window.navigator as { standalone?: boolean })
    .standalone

  return isStandaloneDisplay || iosStandalone === true
}

const isIOS = () => {
  if (typeof window === "undefined") {
    return false
  }

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if already installed
    if (isStandaloneMode()) {
      trackEvent(EVENTS.PWA_INSTALL.ALREADY_INSTALLED)
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: any) => {
      const event = (e.detail || e) as BeforeInstallPromptEvent
      event.preventDefault()
      deferredPromptRef.current = event
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      deferredPromptRef.current = null
    }

    // Check if event was already fired
    if ((window as any).__deferredPWAInstallPrompt) {
      deferredPromptRef.current = (window as any).__deferredPWAInstallPrompt
      setCanInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("pwa:beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("pwa:installed", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("pwa:beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("pwa:installed", handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (isIOS()) {
      // For iOS, we can't programmatically trigger install, 
      // but we return true to indicate the UI should show instructions
      return { outcome: "ios_instruction" as const }
    }

    const installPrompt = deferredPromptRef.current
    if (!installPrompt) {
      return { outcome: "dismissed" as const }
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === "accepted") {
        setIsInstalled(true)
        setCanInstall(false)
      }
      
      return { outcome }
    } catch (err) {
      console.error("Install prompt error:", err)
      return { outcome: "dismissed" as const }
    } finally {
      deferredPromptRef.current = null
      setCanInstall(false)
    }
  }, [])

  return {
    isInstalled,
    canInstall: canInstall || isIOS(), // iOS is always "installable" via manual steps
    install,
    isIOS: isIOS()
  }
}
