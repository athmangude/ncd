import { useState, useEffect } from "react"
import { Check, Settings, Loader2, Bell } from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { NotificationHelpDialog } from "@/components/EnableNotificationsCard"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { useNavigate } from "react-router-dom"
import useNextPWAOnboardingStep from "../../hooks/useNextPWAOnboardingStep"
import { trackEvent, EVENTS } from "@/analytics"
import PatientPageWrapper from "../PatientPageWrapper"

const STEP_ID = "02"

export default function EnableNotificationsPage() {
  const user = usePatientAuthStore((state: any) => state.user)
  const userType: string = "PATIENT"
  const navigate = useNavigate()

  const {
    notificationPermission,
    requestPermission,
    error: permissionError,
  } = usePushNotifications(user?.id, userType)

  const [isRequesting, setIsRequesting] = useState(false)
  const [showNotificationHelp, setShowNotificationHelp] = useState(false)
  const nextStep = useNextPWAOnboardingStep()

  useEffect(() => {
    trackEvent(EVENTS.NOTIFICATIONS.PAGE_VIEW)
  }, [])

  // Automatically show help modal when there's a notification error
  useEffect(() => {
    if (permissionError) {
      trackEvent(EVENTS.NOTIFICATIONS.HELP_DIALOG_OPEN)
      setShowNotificationHelp(true)
    }
  }, [permissionError])

  const handleNext = () => {
    if (nextStep) {
      navigate(nextStep)
    } else {
      navigate("/patients")
    }
  }

  const handleSkip = () => {
    trackEvent(EVENTS.NOTIFICATIONS.SKIP_TAP)
    // Record skip, but step remains incomplete in status check
    localStorage.setItem(`pwa_skip_${STEP_ID}`, "true")
    handleNext()
  }

  const handleEnable = async () => {
    trackEvent(EVENTS.NOTIFICATIONS.ENABLE_TAP)
    setIsRequesting(true)
    try {
      const result = await requestPermission()
      if (result === "granted") {
        trackEvent(EVENTS.NOTIFICATIONS.PERMISSION_GRANTED)
        handleNext()
      } else {
        trackEvent(EVENTS.NOTIFICATIONS.PERMISSION_DENIED)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsRequesting(false)
    }
  }

  const isDenied = notificationPermission === "denied"
  const isGranted = notificationPermission === "granted"

  // Footer is state-driven: granted → single Continue; otherwise a canonical
  // dual footer (Skip + the primary action for that state).
  const footerProps = isGranted
    ? { primaryCta: { label: "Continue", onClick: handleNext } }
    : {
        dualCta: {
          secondary: {
            label: "Skip",
            type: "button" as const,
            onClick: handleSkip,
          },
          primary: isDenied
            ? {
                label: (
                  <>
                    <Settings className="mr-2 w-4 h-4" />
                    How to unblock
                  </>
                ),
                onClick: () => {
                  trackEvent(EVENTS.NOTIFICATIONS.HELP_DIALOG_OPEN)
                  setShowNotificationHelp(true)
                },
              }
            : {
                label: isRequesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" /> Enable updates
                  </>
                ),
                onClick: handleEnable,
                disabled: isRequesting,
              },
        },
      }

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle="Stay in the loop"
      description="Turn on notifications to get instant alerts for payments, loan approvals, and important care reminders."
      {...footerProps}
    >
      <div className="w-full text-left">
        <p className="text-muted-foreground text-sm mb-4">Why?</p>

        <div className="space-y-3">
          <div className="flex items-center gap-1 p-3 bg-card border border-border rounded-xl">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium text-sm">
              Keep SMS for urgent alerts
            </span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-card border border-border rounded-xl">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium text-sm">
              Keep track of every transaction
            </span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-card border border-border rounded-xl">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium text-sm">
              Get progress reminders and reports
            </span>
          </div>
        </div>
      </div>

      {isDenied && (
        <div className="mt-6 bg-red-50 p-4 rounded-lg text-sm text-left w-full border border-red-100 text-red-800">
          <p className="font-medium mb-1">Notifications are blocked</p>
          <p>
            Please go to your browser settings and allow notifications for Jireh
            Health.
          </p>
        </div>
      )}

      <NotificationHelpDialog
        open={showNotificationHelp}
        onOpenChange={setShowNotificationHelp}
      />
    </PatientPageWrapper>
  )
}
