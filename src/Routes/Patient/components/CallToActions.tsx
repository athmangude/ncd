import { formatMoney } from "@/utilities/currencyUtilities"
import { InfoLink } from "./InfoLink"
import notes from "@/assets/icons/notes.png"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import {
  ORG_MEMBERSHIP_SETUP_START_URL,
  PUBLIC_MEMBERSHIP_SETUP_START_URL,
} from "../hooks/useNextMembershipSetupStep"
import { CIRCLE_SETUP_START_URL } from "../hooks/useNextCircleSetupStep"
import { Link, useNavigate } from "react-router-dom"
import verifiedTileIcon from "@/assets/icons/verified-tile.png"
import networkCircleIcon from "@/assets/icons/network-circle.png"
import kycSetup from "@/assets/icons/kyc-setup.png"
import { ChevronRight, ShieldCheck, QrCode } from "lucide-react"
import { UserType } from "../constants/userTypes"
import {
  PWA_START_URL,
  usePWAOnboardingStatus,
  PWA_STEP_CONFIG,
} from "../hooks/useNextPWAOnboardingStep"
import pwaSetup from "@/assets/icons/pwa-setup.png"
import { AlertTriangle, Bell } from "lucide-react"
import axios from "axios"
import { useEffect } from "react"

export interface DashboardAlertCTA {
  text: string
  action: string
  deep_link: string
}

export interface DashboardAlert {
  alert_id: string
  priority: "P0" | "P1" | "P2" | "P3"
  title: string
  message: string
  blocking: boolean
  cta: DashboardAlertCTA
  metadata?: Record<string, any>
}

export function AlertCard({ alert }: { alert: DashboardAlert }) {
  const navigate = useNavigate()
  const { stepStatus } = usePWAOnboardingStatus()

  useEffect(() => {
    if (alert.alert_id === "INSTALL_APP" && stepStatus["01"]) {
      axios
        .post(`${import.meta.env.VITE_API_BASE_URL}/alerts/INSTALL_APP/resolve`)
        .catch((err) =>
          console.error("Failed to resolve INSTALL_APP alert", err)
        )
    }
  }, [alert.alert_id, stepStatus])

  const getIcon = (alertId: string) => {
    switch (alertId) {
      case "PIN_REQUIRED":
        return <ShieldCheck className="w-12 h-12 text-[#00b9db]" />
      case "ID_VERIFICATION_REQUIRED":
        return (
          <AlertTriangle className="w-8 h-8 text-muted-foreground font-normal" />
        )
      case "DOCUMENT_VERIFICATION_REQUIRED":
        return (
          <img src={kycSetup} alt="KYC" className="w-12 h-12 object-contain" />
        )
      case "INSTALL_APP":
        return (
          <img
            src={pwaSetup}
            alt="Circle"
            className="w-12 h-12 object-contain"
          />
        )
      case "CARE_PROFILE_SETUP_REQUIRED":
        return (
          <img
            src={verifiedTileIcon}
            alt="KYC"
            className="w-12 h-12 object-contain"
          />
        )
      case "CIRCLE_CREATE":
      case "CIRCLE_SETUP_INCOMPLETE":
        return (
          <img
            src={networkCircleIcon}
            alt="Circle"
            className="w-12 h-12 object-contain"
          />
        )
      case "LOAN_DEFAULT":
        return (
          <AlertTriangle className="w-8 h-8 text-muted-foreground font-normal" />
        )
      default:
        return <Bell className="w-12 h-12 text-primary" />
    }
  }

  const getStyle = (priority: string) => {
    if (priority === "P0") {
      // Critical - reddish/warm
      return "bg-red-50 border-red-100"
    }
    // Important - default brand-gradient/blueish
    return "bg-brand-gradient-100 border-purple-100"
  }

  return (
    <div className={`${getStyle(alert.priority)} border p-4 rounded-xl `}>
      <div className="flex gap-3 items-center mb-4">
        {getIcon(alert.alert_id)}
        <div>
          <h3 className="text-foreground m-0">{alert.title}</h3>
          <p className="text-sm text-muted-foreground m-0">{alert.message}</p>
        </div>
      </div>

      <button
        onClick={() => navigate(alert.cta.deep_link)}
        className={`w-full ${
          alert.priority === "P0"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-primary hover:bg-purple-600"
        } text-white text-center font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 no-underline cursor-pointer`}
      >
        {alert.cta.text} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export function UploadFinancialStatementsCTA() {
  return (
    <InfoLink
      href="/patients/financial-statements-with-credit-update"
      icon={notes}
      title={`Upload your M-Pesa statement to boost your limit up to ${formatMoney(6_000, "KES")}`}
      description=""
    />
  )
}

export function CompleteMembershipSetupCTA({
  orgName,
  patientType,
}: {
  orgName?: string

  patientType: UserType
}) {
  const title =
    patientType === "ORG"
      ? `Complete your profile to use ${orgName}'s membership.`
      : `Complete your profile to use Jireh`

  const description =
    patientType === "ORG"
      ? "Pay your medical bills with ease using Jireh Advance!"
      : "You could unlock a limit of up to KES 6,000!"
  const firstRoute =
    patientType === "ORG"
      ? ORG_MEMBERSHIP_SETUP_START_URL
      : PUBLIC_MEMBERSHIP_SETUP_START_URL

  return (
    <Link
      className="bg-primary text-white p-4 no-underline grid grid-cols-5 gap-3 justify-between rounded-lg"
      to={firstRoute as string}
    >
      <img
        src={verifiedTileIcon}
        alt="Verified Tile Icon"
        className="w-14 aspect-square object-contain"
        aria-hidden="true"
      />
      <div className="col-span-3">
        <p className="text-lg">{title}</p>
        <p className="font-normal">{description}</p>
      </div>
      <ChevronRight className="w-7 h-7 text-white ml-auto" />
    </Link>
  )
}

export function FundTreatmentCTA() {
  const { type, orgName, canPayMedicalBill } =
    usePatientAuthStore((state: any) => state.user) || {}

  return (
    <section className="w-full flex justify-center fixed bottom-0 left-0 ">
      <div className="w-full px-3 py-2 bg-white border-t border-border max-w-[450px] flex flex-col gap-2">
        {!canPayMedicalBill && (
          <CompleteMembershipSetupCTA orgName={orgName} patientType={type} />
        )}
      </div>
    </section>
  )
}

export function SetPinCTA() {
  const navigate = useNavigate()

  return (
    <button
      className="bg-brand-gradient-100 border border-purple-100 p-4 no-underline flex   gap-3 justify-between rounded-lg mb-7 text-left"
      onClick={() => {
        navigate("/patients/set-pin", {
          state: {
            redirectUrl: "/patients/",
          },
        })
      }}
    >
      <ShieldCheck className="w-7 h-7 text-primary mt-1" aria-hidden="true" />
      <div className="col-span-3">
        <p className="text-lg font-semibold">Set up Payment PIN</p>
        <p className="font-normal text-sm text-muted-foreground">
          You will use this to pay
        </p>
      </div>
      <ChevronRight className="w-7 h-7 text-muted-foreground ml-auto mt-1" />
    </button>
  )
}

export function CareProfileSetupCTA() {
  const user = usePatientAuthStore((state: any) => state.user) || {}

  const hasCareProfile =
    user.insuranceProviders?.length > 0 &&
    user.favoriteCareProviders?.length > 0 &&
    user.focusAreas?.length > 0 &&
    user.ncdStatus !== null

  if (hasCareProfile) return null

  return (
    <div className="bg-brand-gradient-100 border border-purple-100 p-4 rounded-xl mb-7">
      <div className="flex gap-3 items-center mb-4">
        <img
          src={verifiedTileIcon}
          alt="Verified Tile Icon"
          className="w-12 h-12 object-contain"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-foreground m-0">Set up your Jireh Profile</h3>
          <p className="text-sm text-muted-foreground m-0">
            Add your insurance and favorite hospitals for a better experience.
          </p>
        </div>
      </div>

      <Link
        to="/patients/care-profile-setup"
        className="w-full bg-primary hover:bg-purple-600 text-white text-center font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 no-underline"
      >
        Personalise Your Care <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export function CreateCircleCTA() {
  const user = usePatientAuthStore((state: any) => state.user) || {}
  const hasCircle = user.network?.length > 0

  if (hasCircle) return null

  return (
    <div className="bg-brand-gradient-100 border border-purple-100 p-4 rounded-xl mb-7">
      <div className="flex gap-3 items-center mb-4">
        <img
          src={networkCircleIcon}
          alt="Network Circle Icon"
          className="w-12 h-12 object-contain"
        />
        <div>
          <h3 className="text-foreground m-0">Care for those you love</h3>
          <p className="text-sm text-muted-foreground m-0">
            Share benefits & support.
          </p>
        </div>
      </div>

      <Link
        to={CIRCLE_SETUP_START_URL}
        state={{ from: "dashboard" }}
        className="w-full bg-primary hover:bg-purple-600 text-white text-center font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 no-underline"
      >
        Add to your Jireh Circle <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export function CompleteKYCCTA() {
  const user = usePatientAuthStore((state: any) => state.user) || {}

  if (user.isBasicMember) return null

  return (
    <div className="bg-brand-gradient-100 border border-purple-100 p-4 rounded-xl mb-7">
      <div className="flex gap-3 items-center mb-4">
        <img
          src={kycSetup}
          alt="KYC Setup Icon"
          className="w-12 h-12 object-contain"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-foreground m-0">Jireh Plus saves you more</h3>
          <p className="text-sm text-muted-foreground m-0">
            Upgrade for higher savings
          </p>
        </div>
      </div>

      <Link
        to="/patients/kyc-setup-intro"
        className="w-full bg-primary hover:bg-purple-600 text-white text-center font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 no-underline"
      >
        Upgrade To Jireh Plus <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export function PWAOnboardingCTA() {
  const { stepStatus, loading } = usePWAOnboardingStatus()

  if (loading) return null

  // Check if every step is either completed or skipped
  const isComplete = PWA_STEP_CONFIG.every((step) => stepStatus[step.id])

  if (isComplete) return null

  return (
    <div className="bg-brand-gradient-100 border border-purple-100 p-4 rounded-xl mb-7">
      <div className="flex gap-3 items-center mb-4">
        <img
          src={pwaSetup}
          alt="PWA Setup Icon"
          className="w-12 h-12 object-contain"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-foreground m-0">Get the full experience</h3>
          <p className="text-sm text-muted-foreground m-0">
            Install app and enable notifications
          </p>
        </div>
      </div>

      <Link
        to={PWA_START_URL}
        className="w-full bg-primary hover:bg-purple-600 text-white text-center font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 no-underline"
      >
        Personalise my care <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export function ScanQRCTA() {
  const navigate = useNavigate()

  return (
    <button
      className="bg-purple-50 border border-purple-100 p-4 no-underline flex gap-3 justify-between rounded-lg mb-5 text-left w-full hover:bg-purple-100 transition-colors"
      onClick={() => {
        navigate("/patients/scan-qr-intro")
      }}
    >
      <div className="bg-purple-100 p-2 rounded-full h-fit shrink-0">
        <QrCode className="w-6 h-6 text-purple-600" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-base font-semibold text-foreground">
          Scan to Join Circle
        </p>
        <p className="font-normal text-sm text-muted-foreground">
          Show your QR code to invite friends
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto mt-2" />
    </button>
  )
}
