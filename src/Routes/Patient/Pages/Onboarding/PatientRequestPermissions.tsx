import { useState } from "react"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import phonePermission from "@/assets/icons/phone-permission.png"
import locationPermission from "@/assets/icons/location-permission.png"
import { Button } from "@/components/Button"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { useNavigate } from "react-router-dom"

export default function PatientRequestPermissions() {
  const nextStep = useNextOnboardingStep()
  const navigate = useNavigate()

  const [acceptedPushNotifications, setAcceptedPushNotifications] =
    useState(false)
  const [acceptedLocation, setAcceptedLocation] = useState(false)

  const [error, setError] = useState("")

  function requestNotifications() {
    if (Notification.permission === "granted") {
      setAcceptedPushNotifications(true)
    } else {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setAcceptedPushNotifications(true)
        } else {
          setError(
            "Please allow notifications to proceed. You may need to reset your permission settings to allow access."
          )
        }
      })
    }
  }

  function requestLocation() {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        setAcceptedLocation(true)
      } else if (result.state === "prompt") {
        navigator.geolocation.getCurrentPosition(
          () => {
            setAcceptedLocation(true)
          },
          () => {
            setError("Failed to gain location access")
          }
        )
      } else if (result.state === "denied") {
        setError(
          "Please allow location access to proceed. You may need to reset your permission settings to allow access."
        )
      }
    })
  }

  function resolveCurrentStep() {
    if (!acceptedPushNotifications) {
      return (
        <Button size="lg" onClick={requestNotifications}>
          Grant Notification Access
        </Button>
      )
    }

    if (!acceptedLocation) {
      return (
        <Button size="lg" onClick={requestLocation}>
          Grant Location Access
        </Button>
      )
    }

    return (
      <Button size="lg" onClick={() => navigate(nextStep)}>
        Next
      </Button>
    )
  }

  return (
    <PatientAuthWrapper>
      <h1 className="max-w-[20ch]">
        We’re requesting for the following permissions{" "}
      </h1>

      <ul className="flex flex-col gap-5">
        <Permission
          title="Enable Push Notifications"
          icon={phonePermission}
          description="Stay updated! Enable push notifications to receive real-time updates on your loan applications and more. You can manage these in your settings anytime."
          hasAccepted={acceptedPushNotifications}
        />
        <Permission
          title="Geoloaction Permission"
          icon={locationPermission}
          description="Enable Geo-locations for accurate care provider suggestions based of your area."
          hasAccepted={acceptedLocation}
        />
      </ul>

      {error && <p className="text-red-500 font-medium text-sm">{error}</p>}

      {resolveCurrentStep()}

      <Button
        role="link"
        size="lg"
        onClick={() => navigate(nextStep)}
        variant="outline"
      >
        Skip
      </Button>
    </PatientAuthWrapper>
  )
}

function Permission({
  title,
  description,
  icon,
  hasAccepted,
}: {
  title: string
  description: string
  icon: string
  hasAccepted: boolean
}) {
  return (
    <li
      className={`flex gap-3 px-1 py-3 rounded-lg ${hasAccepted && "bg-green-500/10 border border-green-500"}`}
    >
      <img src={icon} alt={title} className="h-6 w-6 mt-2" />

      <div className="flex flex-col gap-1">
        <p>{title}</p>
        <p className="text-xs">{description}</p>
      </div>
    </li>
  )
}
