import { Button } from "@/components/Button"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import { cn } from "@/lib/utils"
import upgradeLogo from "@/assets/icons/upgrade-logo.png"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { getFirstIncompleteStep } from "../../hooks/useNextKYCStep"
import { useOfflinePatientData } from "@/hooks/useOfflinePatientData"
import LoadingPage from "@/Routes/LoadingPage"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"
import {
  PatientDocumentVerificationStatus,
  isIdVerified,
} from "../../enums/PatientIdVerificationStatus"

interface DisplayStep {
  id: string
  label: string
  description?: string
  lockedDescription?: string
  lockedPill?: string
  checkCompletion: (u: any) => boolean
  isPayStep: boolean
}

const DISPLAY_STEPS: DisplayStep[] = [
  {
    id: "01",
    label: "National ID number",
    checkCompletion: (u) => isIdVerified(u?.idVerificationStatus),
    isPayStep: false,
  },
  {
    id: "02",
    label: "National ID front photo",
    checkCompletion: (u) =>
      u?.documentVerificationStatus ===
      PatientDocumentVerificationStatus.PASSED,
    isPayStep: false,
  },
  {
    id: "03",
    label: "Selfie",
    checkCompletion: (u) =>
      u?.documentVerificationStatus ===
      PatientDocumentVerificationStatus.PASSED,
    isPayStep: false,
  },
  {
    id: "04",
    label: "Add 2 people to your Circle",
    description: "Members must accept before your Circle qualifies.",
    checkCompletion: (u) => {
      const network = u?.network || []
      const invites = u?.invites || []
      const allMembers = [...network, ...invites]
      const adultMembers = allMembers.filter(
        (member: any) =>
          member.relationship !== "CHILD" && member.status !== "PENDING"
      )
      return adultMembers.length >= 2
    },
    isPayStep: false,
  },
  {
    id: "05",
    label: "Pay KES 499",
    description: "One-time-fee",
    lockedDescription: "Charged once your Circle is confirmed. Never again.",
    lockedPill: "One time only - unlocks all future loans",
    checkCompletion: (u) => !!u?.hasActiveMembership,
    isPayStep: true,
  },
]

export default function PatientKYCSetupIntro() {
  const navigate = useNavigate()
  const location = useLocation()
  const userFromStore = usePatientAuthStore((state: any) => state.user) || {}

  const { data: networkData, isLoading: isLoadingNetwork } =
    useOfflinePatientData<{
      network: any[]
      invites: any[]
      receivedInvites: any[]
    }>({
      endpoint: "/patient-network/network",
      fetchFn: async () => {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/network`,
          { credentials: "include" }
        )
        if (!resp.ok) {
          const text = await resp.text().catch(() => "")
          throw new Error(text || `Request failed with status ${resp.status}`)
        }
        return resp.json()
      },
    })

  const user = {
    ...userFromStore,
    network: networkData?.network || userFromStore?.network || [],
    invites: networkData?.invites || userFromStore?.invites || [],
  }

  const nextStepRoute = getFirstIncompleteStep(user)
  const firstIncompleteIndex = DISPLAY_STEPS.findIndex(
    (step) => !step.checkCompletion(user)
  )

  useEffect(() => {
    try {
      trackEvent(EVENTS.KYC.INTRO_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  if (isLoadingNetwork) {
    return <LoadingPage />
  }

  return (
    <PatientPageWrapper
      variant="content"
      pageTitle={"Upgrade to Jireh Plus\n& unlock loans"}
      description="Access interest-free loans to pay medical bills instantly with flexible terms."
      headerIcon={
        <img
          src={upgradeLogo}
          alt="Upgrade to Jireh Plus"
          className={HERO_ILLUSTRATION}
        />
      }
      bodyPadding="none"
      footer={
        <div className="flex flex-col gap-3 border-t border-border bg-card p-4">
          <p className=" text-muted-foreground text-center">
            By proceeding, you confirm that you have read and agreed to our{" "}
            <a
              href="https://jireh-health.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-0.5 hover:underline"
            >
              Terms of Service
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </a>
          </p>
          <Button
            className="w-full"
            onClick={() => {
              if (nextStepRoute) {
                navigate(nextStepRoute, { state: location.state })
              } else {
                navigate(location.state?.returnUrl || "/patients", {
                  state: location.state,
                })
              }
            }}
          >
            Continue
          </Button>
        </div>
      }
      className="p-0"
    >
      <div className="px-4 pt-6 pb-4">
        {/* Steps */}
        <div className="flex flex-col gap-3 w-full">
          <p className="text-sm text-muted-foreground">
            Information being collected:
          </p>

          <div className="flex flex-col gap-2">
            {DISPLAY_STEPS.map((step, index) => {
              const isCompleted = step.checkCompletion(user)
              const isNext =
                index === firstIncompleteIndex && firstIncompleteIndex !== -1
              const isLocked = !isCompleted && !isNext && step.isPayStep

              return (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    isCompleted
                      ? "bg-card border-green-400"
                      : isLocked
                        ? "bg-muted border-border"
                        : "bg-card border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-sm text-muted-foreground mt-0.5 shrink-0 w-5">
                        {step.id}
                      </span>
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium",
                            isCompleted
                              ? "text-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {step.label}
                        </div>
                        {step.description && (!step.isPayStep || isNext) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </div>
                        )}
                        {isLocked && step.lockedDescription && (
                          <>
                            <p className="text-xs text-muted-foreground mt-1">
                              {step.lockedDescription}
                            </p>
                            {step.lockedPill && (
                              <span className="inline-flex items-center gap-1.5 mt-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                                {step.lockedPill}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isNext ? (
                        <span className="text-sm font-medium text-foreground">
                          Next
                        </span>
                      ) : step.isPayStep ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
