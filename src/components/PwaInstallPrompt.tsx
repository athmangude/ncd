"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/Button"
import { useToast } from "@/hooks/useToast"

const PWA_INSTALL_PROMPT_STORAGE_KEY = "jireh:pwa-install-prompt-status"

enum PromptStatus {
  DISMISSED = "dismissed",
  INSTALLED = "installed",
}

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const persistPromptStatus = (status: PromptStatus) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(PWA_INSTALL_PROMPT_STORAGE_KEY, status)
}

const getStoredPromptStatus = (): PromptStatus | null => {
  if (typeof window === "undefined") {
    return null
  }

  const stored = window.localStorage.getItem(PWA_INSTALL_PROMPT_STORAGE_KEY)
  return (stored as PromptStatus) ?? null
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

function PwaInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const { toast } = useToast()

  const hidePrompt = useCallback(() => {
    setIsVisible(false)
    deferredPromptRef.current = null
  }, [])

  const showInstallStatusToast = useCallback(
    (outcome: "accepted" | "dismissed") => {
      toast({
        title: outcome === "accepted" ? "App installed" : "Install skipped",
        description:
          outcome === "accepted"
            ? "Open Jireh Health from your home screen for faster access."
            : "You can still install the app later from this banner.",
      })
    },
    [toast]
  )

  const handleInstallClick = useCallback(async () => {
    const installPrompt = deferredPromptRef.current

    // iOS doesn't have beforeinstallprompt, so show instructions via toast
    if (isIOS()) {
      toast({
        title: "Add to Home Screen",
        description:
          "Tap the share button (square with arrow) at the bottom, then select 'Add to Home Screen'.",
      })
      persistPromptStatus(PromptStatus.DISMISSED)
      hidePrompt()
      return
    }

    if (!installPrompt) {
      hidePrompt()
      return
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      persistPromptStatus(
        outcome === "accepted" ? PromptStatus.INSTALLED : PromptStatus.DISMISSED
      )
      showInstallStatusToast(outcome)
    } catch {
      persistPromptStatus(PromptStatus.DISMISSED)
      showInstallStatusToast("dismissed")
    } finally {
      hidePrompt()
    }
  }, [hidePrompt, showInstallStatusToast, toast])

  const handleDismissClick = useCallback(() => {
    persistPromptStatus(PromptStatus.DISMISSED)
    hidePrompt()
  }, [hidePrompt])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const shouldShowPrompt = () => {
      if (isStandaloneMode()) {
        return false
      }

      const storedStatus = getStoredPromptStatus()
      return (
        storedStatus !== PromptStatus.DISMISSED &&
        storedStatus !== PromptStatus.INSTALLED
      )
    }

    // For iOS, show prompt automatically since beforeinstallprompt doesn't fire
    if (isIOS() && shouldShowPrompt()) {
      // Show after a short delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!shouldShowPrompt()) {
        return
      }

      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
      setIsVisible(true)
    }

    const handleAppInstalled = () => {
      persistPromptStatus(PromptStatus.INSTALLED)
      hidePrompt()
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [hidePrompt])

  if (!isVisible) {
    return null
  }

  const isIOSDevice = isIOS()

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 flex w-[min(96vw,720px)] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 text-left shadow-xl shadow-black/25 dark:border-white/10 dark:bg-neutral-950"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">
          Install Jireh Health
        </p>
        {isIOSDevice ? (
          <p className="text-xs text-foreground/70">
            Tap the share button <span className="font-semibold">(□↑)</span> at
            the bottom of your screen, then select{" "}
            <span className="font-semibold">"Add to Home Screen"</span>.
          </p>
        ) : (
          <p className="text-xs text-foreground/70">
            Save the app to your home screen for faster access, offline support,
            and reliable notifications.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleInstallClick}>
          {isIOSDevice ? "Show Instructions" : "Install"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDismissClick}>
          Maybe later
        </Button>
      </div>
      {isIOSDevice && (
        <p className="text-[11px] text-foreground/60">
          After adding to home screen, open the app from there for the best
          experience.
        </p>
      )}
    </div>
  )
}

export default PwaInstallPrompt
