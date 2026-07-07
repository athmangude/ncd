import { Button } from "@/components/Button"
import { useLocation, useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import whatsApp from "@/assets/icons/whatsapp.svg"
import { useOnboardingChecklist } from "../hooks/useOnboardingChecklist"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import IncompleteSignUp from "../components/IncompleteSignUp"
import AppShell from "@/Routes/AppShell"
import { useEffect, useState } from "react"
import axios from "axios"
import PatientDashboardTabs from "./Dashboard/PatientDashboardTabs"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"
import { useSetAmplitudeUserProperties } from "@/hooks/useSetAmplitudeUserId"
import { CloudOff, Bell } from "lucide-react"
import { SetPinCTA } from "../components/CallToActions"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { Lock, Percent, Phone } from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import pinProtectErrorIcon from "@/assets/icons/pin-protect-error.svg"
import logoIcon from "@/assets/icons/long-logo.png"
import { useQuery } from "@tanstack/react-query"

export default function PatientDashboard() {
  const query = useOnboardingChecklist()
  const signOut = usePatientAuthStore((state: any) => state.signOut)
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user)

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const error: any = query.error

    // Check if user is offline AND has cached user data
    const isOffline = !navigator.onLine
    const hasCachedUserData = user && Object.keys(user).length > 0

    if (isOffline && hasCachedUserData) {
      // User is offline but has cached data - show dashboard with cached data
      console.log("[Dashboard] Offline mode: Using cached user data")
      return <Dashboard data={user} />
    }

    // Handle specific error cases
    if (
      error.message?.includes("User not found") ||
      error.response?.data?.message === "User not found"
    ) {
      signOut()
      navigate("/patients/auth")
      return null
    }

    // For other errors, show error block. Wrapped in AppShell because the
    // dashboard route is now a passthrough in PatientsHome (no legacy frame).
    return (
      <AppShell header={null} footer={null}>
        <ErrorBlock
          message={
            isOffline
              ? "You are offline and no cached data is available. Please connect to the internet to load your dashboard."
              : error.response?.data?.message || error.message
          }
        />
      </AppShell>
    )
  }

  return <Dashboard data={query.data} />
}

function Dashboard({ data }: { data: any }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: patientData, isOffline } = usePatientLoginDetails()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/notifications`
      )
      const notifications = response.data.notifications || []
      return notifications.filter((n: any) => n.readStatus === "UNREAD").length
    },
    enabled: !isOffline,
    staleTime: 60 * 1000, // 1 minute
    initialData: 0,
  })

  useEffect(() => {
    try {
      //get inviteId or referrerId from local storage
      const inviteId = localStorage.getItem("inviteId")
      const referrerId = localStorage.getItem("referrerId")

      if (inviteId) {
        localStorage.removeItem("inviteId")
        navigate("/patients/network/accept-invite?inviteId=" + inviteId)
      }

      if (referrerId) {
        localStorage.removeItem("referrerId")
        navigate("/patients/network/accept-share-link?referrerId=" + referrerId)
      }
    } catch {
      //TODO: log to Sentry
    }
    // Mount-only: read invite/referrer from localStorage and route once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Use patient data from offline-capable hook if available, otherwise fall back to auth store
  const userFromPatientData = patientData
    ? {
        ...patientData,
      }
    : null

  const userFromStore = usePatientAuthStore((state: any) => state.user)
  const user = userFromPatientData ?? userFromStore ?? {}

  // Set Amplitude user properties for analytics
  useSetAmplitudeUserProperties(user)

  const { onboardingRedirectLink: dataRedirectLink } = data || {}
  const stateRedirectLink = location.state?.onboardingRedirectLink
  const fromPayMedicalBill = location.state?.fromPayMedicalBill || false

  const onboardingRedirectLink = stateRedirectLink || dataRedirectLink

  if (onboardingRedirectLink) {
    return (
      <IncompleteSignUp
        onboardingRedirectLink={onboardingRedirectLink}
        user={user}
        fromPayMedicalBill={fromPayMedicalBill}
      />
    )
  }

  // The top bar lives in the AppShell header slot (not a `fixed` overlay) so its
  // height is reserved in the flex column — nothing is hidden beneath it — and it
  // aligns to the centered max-w-md card. The bottom tab bar stays `fixed`
  // (framer-motion measured) and the tab content reserves space for it via its
  // own pb-* padding.
  const header = (
    <div className="flex justify-between items-center px-5 py-3 w-full bg-white/95 backdrop-blur-sm shadow-sm border-b border-border">
      <div className=" scale-90 sm:scale-100 origin-top-right">
        <img src={logoIcon} alt="Jireh Logo" width="150" className="h-auto" />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="WhatsApp"
          className="relative"
        >
          <a
            href="https://wa.me/254117118511"
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              src={whatsApp}
              alt="Chat with Us on WhatsApp"
              className="w-6 h-6"
            />
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
          onClick={() => navigate("/patients/notifications")}
        >
          <Bell className="w-6 h-6 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <AppShell header={header} footer={null}>
      <div className="flex flex-col gap-5 relative min-h-full">
        {isOffline && (
          <div className="mb-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 px-3 py-2 text-sm font-medium flex items-center gap-2 sticky top-0 z-40">
            <CloudOff className="h-4 w-4" />
            You are in offline mode. Some features may be unavailable.
          </div>
        )}

        {!user.hasSetPin && <SetPinCTA />}

        <PatientDashboardTabs />
        <AccountLockedDrawer />
      </div>
    </AppShell>
  )
}

function AccountLockedDrawer() {
  const { membershipStatus, careFundAccount, creditLimit } =
    usePatientAuthStore((state: any) => state.user) || {}

  const { remainingAmount } = creditLimit || {}

  const displayedRemainingCreditLimitAmout = Math.max(
    0,
    Number(remainingAmount ?? 0)
  )

  const status = membershipStatus || "PENDING"

  const [open, setOpen] = useState(status === "LOCKED")

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md flex flex-col gap-3 pb-5 px-5 ">
          <DrawerHeader className="space-y-5">
            <img
              src={pinProtectErrorIcon}
              alt="Pin protect error icon"
              className="w-32 h-32 mx-auto"
            />
            <DrawerTitle className="text-3xl font-medium mt-5 text-center">
              Internal funds are blocked.
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground max-w-[35ch] mx-auto text-base">
              You are unable to use your Care Fund and Medical Loan limit due to
              failed security attempts.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-5 p-5">
            <div className="flex gap-5  items-center bg-card px-3 py-2 rounded-lg">
              <Percent className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="">Your Jireh Care Fund</p>
                <p className="text-muted-foreground">
                  Balance:{" "}
                  {formatMoney(careFundAccount?.careFundBalance || 0, "KES")}
                </p>
              </div>

              <Lock className="h-5 w-5 text-red-500 ml-auto " />
            </div>

            <div className="flex gap-5  items-center bg-card px-3 py-2 rounded-2xl">
              <Percent className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="">Jireh Medical Loan</p>
                <p className="text-muted-foreground">
                  Limit:{" "}
                  {formatMoney(displayedRemainingCreditLimitAmout || 0, "KES")}
                </p>
              </div>

              <Lock className="h-5 w-5 text-red-500 ml-auto " />
            </div>
          </div>

          <DrawerFooter>
            <a href="tel:+254117118511" className="no-underline w-full">
              <Button type="button" role="link" size="lg" className="w-full">
                <Phone className="w-5 h-5 mr-2" />
                Call Jireh Support
              </Button>
            </a>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
