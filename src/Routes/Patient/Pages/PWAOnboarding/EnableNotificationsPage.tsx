import { useState, useEffect } from "react"
import { Check, Settings, Loader2, Bell } from "lucide-react"
import { Button } from "@/components/Button"
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

  const footer = (
    <div className="border-t bg-white p-4">
      {!isDenied && !isGranted && (
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
            onClick={handleEnable}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                {" "}
                <Bell className="w-4 h-4 mr-2" /> Enable updates
              </>
            )}
          </Button>
        </div>
      )}

      {isGranted && (
        <Button className="w-full" onClick={handleNext}>
          Continue
        </Button>
      )}

      {isDenied && (
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
            onClick={() => {
              trackEvent(EVENTS.NOTIFICATIONS.HELP_DIALOG_OPEN)
              setShowNotificationHelp(true)
            }}
          >
            <Settings className="mr-2 w-4 h-4" />
            How to unblock
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle="Stay in the loop"
      description="Turn on notifications to get instant alerts for payments, loan approvals, and important care reminders."
      footer={footer}
    >
      <div className="w-full text-left">
        <p className="text-muted-foreground text-sm mb-4">Why?</p>

        <div className="space-y-3">
          <div className="flex items-center gap-1 p-3 bg-white border border-border rounded-xl">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium text-sm">
              Keep SMS for urgent alerts
            </span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-white border border-border rounded-xl">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium text-sm">
              Keep track of every transaction
            </span>
          </div>
          <div className="flex items-center gap-1 p-3 bg-white border border-border rounded-xl">
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
