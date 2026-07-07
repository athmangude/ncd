
import { useState, useEffect } from "react";
import { Download, Loader2, HeartPulse, WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./Dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
    __hasShownPWAInstallToast?: boolean;
  }
}

const InstallAppCard = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const isiOSDevice =
      typeof window !== "undefined" &&
      /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
    if (isiOSDevice) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e: CustomEvent) => {
      const event = (e.detail || window.__deferredPWAInstallPrompt) as BeforeInstallPromptEvent | null;
      if (event) {
        setDeferredPrompt(event);
        setShowInstallButton(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);

      // Avoid showing duplicate success toasts if multiple listeners/tabs fire
      if (window.__hasShownPWAInstallToast) return;
      window.__hasShownPWAInstallToast = true;

      toast({
        title: "App installed successfully!",
        description: "Thanks for installing the app ",
      });
    };

    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      if (isStandalone || isIOSStandalone) {
        setShowInstallButton(false);
        return true;
      }
      return false;
    };

    window.addEventListener("pwa:beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    // If the prompt was captured before this component mounted, use it
    if (window.__deferredPWAInstallPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
      setShowInstallButton(true);
    }

    if (!checkIfInstalled()) {
      setTimeout(() => {
        if (!deferredPrompt) {
          // ('PWA install criteria not met yet')
        }
      }, 3000);

      // On iOS Safari, the standard PWA install prompt is not supported.
      // We still want to surface the install card so users can follow manual steps.
      if (isiOSDevice) {
        setShowInstallButton(true);
      }
    }

    return () => {
      window.removeEventListener("pwa:beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [deferredPrompt, toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Install not available",
        description: "Refresh the page or use your browser menu.",
      });
      return;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome !== "accepted") {
        toast({
          title: "Installation cancelled",
          variant: "destructive",
        });
        setShowInstallButton(false);
      }
    } catch {
      toast({
        title: "Installation failed",
        description: "Please try again.",
        variant: "destructive",
      });
      setShowInstallButton(false);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setIsDialogOpen(false);
    }
  };

  const handleOpenDialog = () => {
    // On iOS, always show the instructional modal with manual install steps.
    if (isIOS) {
      setIsDialogOpen(true);
      return;
    }

    // If install prompt isn't available yet, fall back to existing behavior
    if (!deferredPrompt) {
      void handleInstall();
      return;
    }

    setIsDialogOpen(true);
  };

  // Don't show if install prompt not available
  if (!showInstallButton) return null;

  return (
    <>
      <div className=" w-full  rounded-3xl p-5 font-medium bg-gradient-card to-brand-gradient-200 from-brand-gradient-100 text-foreground grid  ">
        <div className="flex-1">
          <p className="text-sm md:text-base font-medium">
            Install Jireh app to get the full benefits of the app
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Faster access, offline support, and timely notifications.
          </p>
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleOpenDialog}
              disabled={isInstalling}
              className="shrink-0"
              aria-label="Install Jireh App"
            >
              {isInstalling ? "Installing..." : "Install App Now"}
              {isInstalling ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              Install Jireh App
            </DialogTitle>
          </DialogHeader>

          {isIOS ? (
            <>
              <div className="space-y-4 py-4 text-sm">
                <p className="text-sm text-muted-foreground">
                  To install <span className="font-medium">Jireh Health</span> on your iPhone, follow these quick steps in Safari:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Tap the <span className="font-medium">Share</span> icon in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <span className="font-medium">Add to Home Screen</span>.</li>
                  <li>Confirm the name (e.g. &quot;Jireh Health&quot;) and tap <span className="font-medium">Add</span>.</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  Once added, you can open Jireh Health directly from your home screen just like a native app.
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
                      Open Jireh Health straight from your home screen — fast, seamless, and always ready when you need it.
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
                      Check your important health info anytime, even with poor or no internet connection.
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
                      Get the latest features automatically, without any downloads or updates.
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
    </>
  );
};

export default InstallAppCard

