import { useState } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import { ProtectedRoute } from "@/components/ProtectedResource"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { MEMBER_LOAN_ROLES } from "../../constants/userTypes"
import { Alert, AlertDescription } from "@/components/Alert"
import { InfoIcon, XIcon } from "lucide-react"

export default function PasscodeGuide() {
  const user = usePatientAuthStore((state) => state.user)
  return (
    <ProtectedRoute userRole={user?.type} allowedRoles={MEMBER_LOAN_ROLES}>
      <PatientPageWrapper title="Financial Statements">
        <InstructionsSection />
      </PatientPageWrapper>
    </ProtectedRoute>
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
            console.log("Gmail intent failed, mailto should work")
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
            <button
              onClick={dismissAlert}
              className="absolute right-2 top-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}

      <div className="flex flex-col p-4 gap-6">
        <h1 className="text-2xl font-semibold">What is a passcode?</h1>
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
          <button
            onClick={openSMSApp}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Open your SMS app
          </button>
          <button
            onClick={openEmailApp}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Open your email app
          </button>
        </div>
      </div>
    </>
  )
}
