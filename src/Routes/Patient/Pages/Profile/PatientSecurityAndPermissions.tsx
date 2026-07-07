import { Shield, ChevronRight, LayoutGrid, Bell, MapPin } from "lucide-react"
import { Switch } from "@/components/Switch"
import { SectionTitle } from "@/components/SectionTitle"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useSessionContext } from "supertokens-auth-react/recipe/session"

// Hooks
import { usePwaInstall } from "@/hooks/usePwaInstall"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useLocationPermission } from "@/hooks/useLocationPermission"
import {
  useNotificationFlow,
  NotificationPermissionDrawer,
} from "../Loans/RequestLoan/NotificationPermissionDrawer"

// Components
import { InstallAppDrawer } from "./components/InstallAppDrawer"
import { LocationPermissionDrawer } from "./components/LocationPermissionDrawer"

export default function PatientSecurityAndPermissions() {
  const navigate = useNavigate()
  const session = useSessionContext()
  const userId = session.loading ? undefined : session.userId

  // PWA Install
  const { isInstalled, install, isIOS } = usePwaInstall()
  const [installDrawerOpen, setInstallDrawerOpen] = useState(false)

  // Notifications
  const { notificationPermission } = usePushNotifications(userId, "PATIENT")
  const notificationFlow = useNotificationFlow(userId)

  // Location
  const {
    locationPermission,
    requestLocation,
    loading: locationLoading,
  } = useLocationPermission()
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false)

  const handleInstallToggle = () => {
    if (!isInstalled) {
      setInstallDrawerOpen(true)
    }
  }

  const handleNotificationToggle = () => {
    notificationFlow.checkAndProceed(() => {
      // If permission is already granted, we don't need to do anything
      // The switch will already be on
    })
  }

  const handleLocationToggle = () => {
    if (locationPermission !== "granted") {
      setLocationDrawerOpen(true)
    }
  }

  const onLocationEnable = async () => {
    try {
      await requestLocation()
      setLocationDrawerOpen(false)
    } catch (error) {
      console.error("Location permission denied or error", error)
      // Optional: show help or toast
    }
  }

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title="Security & Permissions"
          onBack={() => navigate("/patients", { state: { tab: "profile" } })}
        />
      }
      footer={null}
    >
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="text-center items-center">
          <h1>Unlock the full experience</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You can manage these permissions anytime in your settings.
          </p>
        </div>

        {/* Change PIN Action */}
        <button
          onClick={() => navigate("/patients/change-pin")}
          className="flex items-center gap-4 bg-transparent text-left group w-full py-2"
        >
          <div className="text-muted-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <SectionTitle level={3}>Change PIN</SectionTitle>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Permissions Section */}
        <div className="flex flex-col gap-4">
          <SectionTitle>Permissions</SectionTitle>

          <div className="flex flex-col gap-6">
            {/* Get the App */}
            <div className="flex items-start gap-4">
              <div className="text-muted-foreground mt-1">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <SectionTitle level={3}>Get the App</SectionTitle>
                  <Switch
                    checked={isInstalled}
                    onCheckedChange={handleInstallToggle}
                    disabled={isInstalled} // Disable if already installed so user can't toggle off (which doesn't make sense for PWA install)
                  />
                </div>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Install Jireh to your home screen for faster access and an
                  app-like experience, including offline access.
                </p>
              </div>
            </div>

            {/* Receive Notifications */}
            <div className="flex items-start gap-4">
              <div className="text-muted-foreground mt-1">
                <Bell className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <SectionTitle level={3}>Receive Notifications</SectionTitle>
                  <Switch
                    checked={notificationPermission === "granted"}
                    onCheckedChange={handleNotificationToggle}
                    disabled={notificationPermission === "granted"}
                  />
                </div>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Stay up-to-date with important alerts, updates, or special
                  offers relevant to you.
                </p>
              </div>
            </div>

            {/* Use My Location */}
            <div className="flex items-start gap-4">
              <div className="text-muted-foreground mt-1">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <SectionTitle level={3}>Use My Location</SectionTitle>
                  <Switch
                    checked={locationPermission === "granted"}
                    onCheckedChange={handleLocationToggle}
                    disabled={locationPermission === "granted"}
                  />
                </div>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Find nearby services, personalize content, and provide local
                  updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Drawers */}
        <InstallAppDrawer
          isOpen={installDrawerOpen}
          onClose={() => setInstallDrawerOpen(false)}
          onInstall={install}
          isIOS={isIOS}
        />

        <NotificationPermissionDrawer
          isOpen={notificationFlow.isOpen}
          onClose={notificationFlow.close}
          onEnable={notificationFlow.handleEnable}
          onSkip={notificationFlow.handleSkip}
          isRequesting={notificationFlow.isRequesting}
          showHelp={notificationFlow.showHelp}
        />

        <LocationPermissionDrawer
          isOpen={locationDrawerOpen}
          onClose={() => setLocationDrawerOpen(false)}
          onEnable={onLocationEnable}
          isLoading={locationLoading}
        />
      </div>
    </MobileWrapper>
  )
}
