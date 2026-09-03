import { useState, useEffect } from "react"
import { AlertDialog } from "radix-ui"
import {
  Download,
  Loader2,
  Check,
  HeartPulse,
  WifiOff,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { Button } from "@/components/Button"
import { trackEvent, EVENTS } from "@/analytics"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/Dialog"
import { ConfirmDialogContent } from "@/components/ConfirmDialog"
import { useNavigate } from "react-router-dom"
import useNextPWAOnboardingStep from "../../hooks/useNextPWAOnboardingStep"
import PatientPageWrapper from "../PatientPageWrapper"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null
    __hasShownPWAInstallToast?: boolean
  }
}

const STEP_ID = "01"

export default function InstallAppPage() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const nextStep = useNextPWAOnboardingStep()

  useEffect(() => {
    trackEvent(EVENTS.PWA_INSTALL.INSTALL_PAGE_VIEW)
  }, [])

  useEffect(() => {
    const isiOSDevice =
      typeof window !== "undefined" &&
      /iphone|ipad|ipod/i.test(window.navigator.userAgent || "")
    if (isiOSDevice) {
      setIsIOS(true)
    }

    const handleBeforeInstallPrompt = (e: CustomEvent) => {
      e.preventDefault() // Prevent mini-infobar
      const event = (e.detail ||
        window.__deferredPWAInstallPrompt) as BeforeInstallPromptEvent | null
      if (event) {
        setDeferredPrompt(event)
        trackEvent(EVENTS.PWA_INSTALL.INSTALL_PROMPT_AVAILABLE, {
          isIos: false,
        })
      }
    }

    const handleAppInstalled = () => {
      trackEvent(EVENTS.PWA_INSTALL.INSTALL_CONFIRMED)
      localStorage.setItem("pwaInstalled", "true")
      setDeferredPrompt(null)
      handleNext()
    }

    window.addEventListener(
      "pwa:beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    )
    window.addEventListener("appinstalled", handleAppInstalled)

    if (window.__deferredPWAInstallPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt)
      trackEvent(EVENTS.PWA_INSTALL.INSTALL_PROMPT_AVAILABLE, { isIos: false })
    }

    return () => {
      window.removeEventListener(
        "pwa:beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
    // Mount-only event-listener setup; including handleNext would tear down and re-add listeners on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNext = () => {
    if (nextStep) {
      navigate(nextStep)
    } else {
      navigate("/patients")
    }
  }

  const handleSkip = () => {
    trackEvent(EVENTS.PWA_INSTALL.SKIP_TAP)
    setIsSkipDialogOpen(true)
  }

  const handleSkipConfirm = (_dontAskAgain: boolean) => {
    trackEvent(EVENTS.PWA_INSTALL.SKIP_DONT_ASK_AGAIN)
    setIsSkipDialogOpen(false)

    // Record skip
    localStorage.setItem(`pwa_skip_${STEP_ID}`, "true")

    handleNext()
  }

  const handleRemindMeLater = () => {
    trackEvent(EVENTS.PWA_INSTALL.SKIP_REMIND_LATER)
    setIsSkipDialogOpen(false)

    // Record skip
    localStorage.setItem(`pwa_skip_${STEP_ID}`, "true")

    handleNext()
  }

  // DISMISSED
  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (!isIOS) {
        toast({
          title: "Install not available",
          description:
            "You might already have the app installed or your browser doesn't support it.",
        })
      }
      return
    }

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        trackEvent(EVENTS.PWA_INSTALL.INSTALL_ACCEPTED)
        // handleAppInstalled will fire
      } else {
        trackEvent(EVENTS.PWA_INSTALL.INSTALL_DISMISSED)
        toast({
          title: "Installation cancelled",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Installation failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsInstalling(false)
      setIsDialogOpen(false)
      setDeferredPrompt(null)
    }
  }

  const handleOpenDialog = () => {
    trackEvent(EVENTS.PWA_INSTALL.INSTALL_TAP, { isIos: isIOS })
    // On iOS, always show the instructional modal with manual install steps.
    if (isIOS) {
      setIsDialogOpen(true)
      return
    }

    // If install prompt isn't available yet, fall back to existing behavior
    if (!deferredPrompt) {
      void handleInstall()
      return
    }

    setIsDialogOpen(true)
  }

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle="Install the app"
      description="Add Jireh to your home screen for faster access and offline reliability—no download required."
      footer={
        <div className="border-t bg-card p-4">
          <div className="flex gap-4">
            <Button
              className="w-1/3 "
              variant="secondary"
              type="button"
              onClick={handleSkip}
            >
              Skip
            </Button>

            <Button
              className="w-2/3"
              size="lg"
              role="link"
              type="submit"
              onClick={handleOpenDialog}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isInstalling ? "Installing..." : "Install"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full">
        <p className="text-muted-foreground text-sm mb-1">Why?</p>

        <div className="space-y-4 bg-card rounded-xl">
          <div className="flex items-center gap-1 p-3 bg-card border border-border rounded-lg ">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground ">Use Jireh offline</span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-card border border-border rounded-lg ">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground ">Use less data when online</span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-card border border-border rounded-lg ">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground ">Access your account 24/7</span>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Jireh App</DialogTitle>
            <DialogDescription className="sr-only">
              Steps to install the Jireh Health app on your device.
            </DialogDescription>
          </DialogHeader>

          {isIOS ? (
            <>
              <div className="space-y-4 py-4 text-sm">
                <p className="text-sm text-muted-foreground">
                  To install <span className="font-medium">Jireh Health</span>{" "}
                  on your device, follow these steps in your Browser:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    Tap the <span className="font-medium">Share</span> icon in
                    Browser&apos;s toolbar.
                  </li>
                  <li>
                    Scroll down and tap{" "}
                    <span className="font-medium">Add to Home Screen</span>.
                  </li>
                  <li>
                    Confirm the name (e.g. &quot;Jireh Health&quot;) and tap{" "}
                    <span className="font-medium">Add</span>.
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  Once added, you can open Jireh Health directly from your home
                  screen just like a native app.
                </p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                  aria-label="Close install instructions"
                >
                  Got it
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4 text-sm">
                {/* Instant Access to Care */}
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary p-2 shrink-0">
                    <HeartPulse className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Instant Access to Care</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Open Jireh Health straight from your home screen — fast,
                      seamless, and always ready when you need it.
                    </p>
                  </div>
                </div>

                {/* Reliable, Even Offline */}
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary p-2 shrink-0">
                    <WifiOff className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Reliable, Even Offline</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check your important health info anytime, even with poor
                      or no internet connection.
                    </p>
                  </div>
                </div>

                {/* Always Up-to-Date */}
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary p-2 shrink-0">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Always Up-to-Date</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get the latest features automatically, without any
                      downloads or updates.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full sm:w-auto"
                  aria-label="Install Jireh App"
                >
                  {isInstalling ? "Installing..." : "Install Jireh App"}
                  {isInstalling ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/*
       * Not a ConfirmDialog: this is a real 2-choice decision ("remind
       * later" vs "don't ask again"), neither of which is a "cancel" — so it
       * doesn't fit ConfirmDialog's fixed Confirm/Cancel API. Built directly
       * on the same AlertDialog primitive (via the exported
       * ConfirmDialogContent) so it keeps both real actions while no longer
       * being silently dismissible via outside-click/Escape with neither
       * choice recorded.
       */}
      <AlertDialog.Root
        open={isSkipDialogOpen}
        onOpenChange={setIsSkipDialogOpen}
      >
        <ConfirmDialogContent>
          <AlertDialog.Title className="text-2xl font-semibold leading-none tracking-tight">
            Skip Installation?
          </AlertDialog.Title>
          <AlertDialog.Description className="sr-only">
            Choose whether to be reminded later or not asked again about
            installing the app.
          </AlertDialog.Description>
          <div className="py-4 space-y-3">
            <Button
              className="w-full justify-start"
              onClick={() => handleRemindMeLater()}
            >
              Remind me later
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => handleSkipConfirm(true)}
            >
              Don&apos;t ask again
            </Button>
          </div>
        </ConfirmDialogContent>
      </AlertDialog.Root>
    </PatientPageWrapper>
  )
}
