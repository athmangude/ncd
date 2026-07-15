import { Button } from "@/components/Button"
import PatientPageWrapper from "../Pages/PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import { useNavigate } from "react-router-dom"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/Item"
import createAccount from "@/assets/icons/create-account.png"
import { isIdVerified } from "../enums/PatientIdVerificationStatus"
import successIcon from "@/assets/icons/care-profile-setup.png"

const STEPS = [
  {
    id: 1,
    label: "Phone number",
    route: null,
  },
  {
    id: 2,
    label: "Full name",
    route: "/patients/personal-details",
  },
  {
    id: 3,
    label: "Create your PIN",
    route: "/patients/set-pin",
  },
  {
    id: 4,
    label: "ID Verification",
    route: "/patients/id-verification-onboarding",
  },
]

export default function IncompleteSignUp({
  onboardingRedirectLink,
  user,
  fromPayMedicalBill = false,
  isCompletingProfile = false,
  showBack = false,
}: {
  onboardingRedirectLink: string
  user?: any
  fromPayMedicalBill?: boolean
  isCompletingProfile?: boolean
  /**
   * Whether the bar shows a back arrow. Only true for callers that reached
   * this screen via a real navigation the user can reverse (e.g.
   * CompleteProfilePage's `/complete-profile` route). PatientDashboard renders
   * this in place of the dashboard itself at `/patients` whenever onboarding
   * is incomplete — there's no dashboard underneath to go back to there, so it
   * must never pass this.
   */
  showBack?: boolean
}) {
  const navigate = useNavigate()

  // Determine current step index
  // If route is found in link, that step is Current (so previous are completed)
  // If link is for a later step not in list, all are completed.
  let currentStepIndex = STEPS.findIndex(
    (step) => step.route && onboardingRedirectLink.includes(step.route)
  )

  // If not found in list, and link exists, assume it's a later step (all completed)
  // Unless it matches something else specific?
  // We can refine this if we know the full list of routes, but for these 4 steps:
  // If redirect is NOT one of these, and we are incomplete, it's likely a step after ID verification.
  if (currentStepIndex === -1 && onboardingRedirectLink) {
    // Check if it's "id-verification-failure" - handled by includes("id-verification") above?
    // "id-verification-failure" includes "id-verification", so it matches index 3 (Step 4).

    // If it didn't match anything (e.g. referral-code), assume all 4 steps are done.
    currentStepIndex = STEPS.length
  }

  const checkStepCompletion = (stepId: number) => {
    if (!user) return false

    switch (stepId) {
      case 1: // Phone number
        return true // Always true if they are here
      case 2: // Full name
        return !!(user.firstName && user.lastName)
      case 3: // PIN
        return !!user.hasSetPin
      case 4: // ID Verification
        return isIdVerified(user.idVerificationStatus)
      default:
        return false
    }
  }

  // Self-shells via PatientPageWrapper's content variant (canonical slim app
  // bar + PageHeader): the routes that render it (the "/patients" incomplete
  // state and "/complete-profile") are passthrough in PatientsHome's
  // container, so the canonical shell draws the frame here. The bespoke
  // #FDF4FF canvas tint (Task 8 batch 2) is dropped so the screen inherits the
  // shell's single surface instead of painting its own.
  const footer = (
    <div className="p-4">
      <Button
        className="w-full"
        role="link"
        onClick={() => {
          const nextRoute =
            onboardingRedirectLink ||
            (fromPayMedicalBill || isCompletingProfile
              ? "/patients/payment/request-payment/how-to-pay"
              : "/patients")
          navigate(nextRoute, {
            state: {
              fromDashboard: true,
            },
          })
        }}
      >
        Continue
      </Button>
    </div>
  )

  const headline =
    fromPayMedicalBill || isCompletingProfile
      ? "Complete your profile"
      : "Create your account in 4 easy steps!"

  return (
    <PatientPageWrapper
      variant="content"
      isRoot={!showBack}
      barTitle={headline}
      showStepper={false}
      headerIcon={
        <img
          src={
            fromPayMedicalBill || isCompletingProfile
              ? successIcon
              : createAccount
          }
          alt=""
          className={HEADER_ICON}
        />
      }
      pageTitle={headline}
      description={
        fromPayMedicalBill || isCompletingProfile
          ? "Unlock cashback when you pay with Jireh Health."
          : "Secure your identity to unlock healthcare support."
      }
      headerAction={
        <div className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 mt-2">
          <Clock size={14} />
          Only takes 2mins!
        </div>
      }
      footer={footer}
    >
      <div className="flex flex-col gap-2 w-full">
        <p className="text-muted-foreground text-sm font-medium">
          Information being collected:
        </p>
        <ItemGroup className="gap-1.5">
          {STEPS.map((step, index) => {
            // Use user data if available, fallback to sequential logic
            const isCompleted = user
              ? checkStepCompletion(step.id)
              : index < currentStepIndex

            const isCurrent = index === currentStepIndex

            return (
              <Item
                key={step.id}
                size="sm"
                variant="outline"
                className={cn(isCompleted && "bg-success border-success-solid")}
              >
                <ItemContent className="flex-row items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCompleted
                        ? "text-success-solid"
                        : "text-muted-foreground"
                    )}
                  >
                    {String(step.id).padStart(2, "0")}
                  </span>
                  <ItemTitle
                    className={cn(
                      isCompleted ? "text-success-solid" : "text-foreground"
                    )}
                  >
                    {step.label}
                  </ItemTitle>
                </ItemContent>

                {isCompleted && (
                  <ItemActions>
                    <div className="rounded-full border border-success-solid p-0.5">
                      <Check
                        className="text-success-solid w-3 h-3"
                        strokeWidth={3}
                      />
                    </div>
                  </ItemActions>
                )}

                {isCurrent && !isCompleted && (
                  <ItemActions>
                    <span className="text-sm text-muted-foreground font-medium">
                      Next
                    </span>
                  </ItemActions>
                )}
              </Item>
            )
          })}
        </ItemGroup>
      </div>
    </PatientPageWrapper>
  )
}
