import { useState } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import { Alert, AlertDescription } from "@/components/Alert"
import { Button } from "@/components/Button"
import { InfoIcon, XIcon } from "lucide-react"

// Loan-role access is enforced once at the route level (MemberLoanRouteGuard in
// PatientsHome); this page no longer self-guards.
export default function PasscodeGuide() {
  return (
    <PatientPageWrapper title="Financial Statements">
      <InstructionsSection />
    </PatientPageWrapper>
  )
}

function InstructionsSection() {
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const dismissAlert = () => {
    setAlertMessage(null)
  }

  const openSMSApp = () => {
    try {
      if (navigator.userAgent.match(/Android/i)) {
        window.location.href = "sms:"
      } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        window.location.href = "sms:"
      } else {
        setAlertMessage(
          "SMS app opening is only available on mobile devices. Please check your phone's messaging app manually."
        )
      }
    } catch {
      setAlertMessage(
        "Unable to open SMS app automatically. Please check your phone's messaging app for texts from 'MPESA'."
      )
    }
  }

  const openEmailApp = () => {
    try {
      if (navigator.userAgent.match(/Android/i)) {
        window.location.href = "mailto:"

        setTimeout(() => {
          try {
            window.location.href =
              "intent://send?type=text/plain#Intent;scheme=mailto;package=com.google.android.gm;end"
          } catch {
            // Gmail intent unavailable — the mailto fallback handles it
          }
        }, 1000)
      } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        window.location.href = "mailto:"
      } else {
        window.location.href = "mailto:"
      }
    } catch {
      setAlertMessage(
        "Unable to open email app automatically. Please check your email inbox for messages from Safaricom."
      )
    }
  }

  return (
    <>
      {alertMessage && (
        <div className="p-4">
          <Alert className="border-blue-200 bg-blue-50">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 pr-8">
              {alertMessage}
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={dismissAlert}
              className="absolute right-2 top-2"
              aria-label="Dismiss"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </Alert>
        </div>
      )}

      <div className="flex flex-col p-4 gap-6">
        <h1>What is a passcode?</h1>
        <ul className="flex flex-col gap-4">
          <li>• Some statements are password-protected for security</li>
          <li>• Safaricom sends the passcode via SMS or email</li>
          <li>• The passcode is usually 6 digits long</li>
          <li>• Check your messages for texts from 'MPESA'</li>
          <li>
            • If you can't find it, request a new statement or contact Safaricom
          </li>
        </ul>
        <div className="flex flex-col gap-3">
          <Button onClick={openSMSApp} className="w-full">
            Open your SMS app
          </Button>
          <Button onClick={openEmailApp} className="w-full">
            Open your email app
          </Button>
        </div>
      </div>
    </>
  )
}
