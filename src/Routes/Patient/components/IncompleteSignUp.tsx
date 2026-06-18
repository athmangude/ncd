import { Button } from "@/components/Button"
import PatientAuthHeadline from "./PatientAuthHeadline"
import { useNavigate } from "react-router-dom"
import PatientAuthWrapper from "./PatientAuthWrapper"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
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
}: {
  onboardingRedirectLink: string
  user?: any
  fromPayMedicalBill?: boolean
  isCompletingProfile?: boolean
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

  return (
      <div className={cn("min-h-screen w-full",
        !fromPayMedicalBill|| !isCompletingProfile && "bg-[#FDF4FF]"
      )}>
      <PatientAuthWrapper>
        <div className="flex flex-col items-center gap-2 mb-2">
        <div className="flex flex-col items-center justify-center mb-6">
          <img
            src={fromPayMedicalBill || isCompletingProfile ? successIcon : createAccount}
            alt="createAccount"
            className="w-[50px] mb-3"
            aria-hidden="true"
          />
          <PatientAuthHeadline text={fromPayMedicalBill || isCompletingProfile ? "Complete your profile" : "Create your account in 4 easy steps!"} />
        </div>
        <p className="text-neutral-500 text-center text-sm">
          {fromPayMedicalBill || isCompletingProfile ? "Unlock cashback when you pay with Jireh Health." : "Secure your identity to unlock healthcare support."}
        </p>
        <div className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 mt-2">
          <Clock size={14} />
          Only takes 2mins!
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <p className="text-neutral-500 text-sm font-medium">
          Information being collected:
        </p>
        <div className="flex flex-col gap-3">
          {STEPS.map((step, index) => {
            // Use user data if available, fallback to sequential logic
            const isCompleted = user
              ? checkStepCompletion(step.id)
              : index < currentStepIndex
              
            const isCurrent = index === currentStepIndex

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-colors",
                  isCompleted
                    ? "bg-green-50 border-green-500"
                    : "bg-white border-neutral-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCompleted ? "text-green-700" : "text-neutral-400"
                    )}
                  >
                    {String(step.id).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "font-medium text-sm",
                      isCompleted ? "text-green-900" : "text-neutral-900"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {isCompleted && (
                    <div className="rounded-full border border-green-500 p-0.5">
                        <Check className="text-green-500 w-3 h-3" strokeWidth={3} />
                    </div>
                )}

                {isCurrent && !isCompleted && (
                  <span className="text-sm text-neutral-400 font-medium">
                    Next
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="pb-20" />

      <div className={cn("fixed bottom-0 left-0 right-0 p-4 z-50",
        !fromPayMedicalBill || !isCompletingProfile ? "bg-[#FDF4FF]" : "bg-white"
      )}>
        <div className="max-w-md mx-auto w-full">
          <Button
            className="w-full"
            role="link"
            onClick={() => {
              const nextRoute = onboardingRedirectLink || (fromPayMedicalBill || isCompletingProfile ? "/patients/payment/request-payment/how-to-pay" : "/patients")
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
      </div>
    </PatientAuthWrapper>
    </div>
  )
}
