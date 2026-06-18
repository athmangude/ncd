import { useNavigate } from "react-router-dom"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import careProfileSetup from "@/assets/icons/care-profile-setup.png"
import { CARE_PROFILE_STEP_CONFIG, getFirstIncompleteCareProfileStep } from "../../hooks/useNextCareProfileStep"

export default function CareProfileSetupIndicator() {
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user) || {}


  const firstIncompleteRoute = getFirstIncompleteCareProfileStep(user)

  return (
    <MobileWrapper
      header={<BackTitleHeader title="" onBack={() => navigate(-1)} />}
      footer={
        <PrimaryCTAFooter
          label="Continue"
          onClick={() => {
            if (firstIncompleteRoute) {
              navigate(firstIncompleteRoute)
            } else {
              navigate("/patients")
            }
          }}
        />
      }
    >
      <div>
        <div className="flex flex-col items-center gap-2 mb-8 mt-4">
            <div className="relative">
                <img
                    src={careProfileSetup} // Using verified tile as it fits "Jireh profile"
                    alt="Jireh Profile"
                    className="w-16 h-16 mb-4"
                    aria-hidden="true"
                />
            </div>
          
            <h1 className="text-2xl font-semibold text-center text-neutral-900">Personalize your care</h1>
            
            <p className="text-neutral-500 text-center text-sm px-4">
                Tell us about your health needs so we can connect you with the right providers and tailored offers.
            </p>
            
            <div className="bg-[#F3E8FF] text-[#7E22CE] px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 mt-2">
                <Clock size={14} />
                Only takes 2mins!
            </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
            <p className="text-neutral-500 text-sm font-medium">
            Information being collected:
            </p>
            <div className="flex flex-col gap-3">
            {CARE_PROFILE_STEP_CONFIG.map((step) => {
                const isCompleted = step.checkCompletion(user)
                
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
                    <div className="flex items-center gap-4">
                    <span
                        className={cn(
                        "text-sm font-medium text-neutral-500",
                        )}
                    >
                        {step.id}
                    </span>
                    <span
                        className={cn(
                        "font-medium text-sm text-neutral-900",
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
                </div>
                )
            })}
            </div>
        </div>
      </div>
    </MobileWrapper>
  )
}
