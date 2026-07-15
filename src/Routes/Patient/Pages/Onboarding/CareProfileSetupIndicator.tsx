import { useNavigate } from "react-router-dom"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import PatientPageWrapper from "../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/Item"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import careProfileSetup from "@/assets/icons/care-profile-setup.png"
import {
  CARE_PROFILE_STEP_CONFIG,
  getFirstIncompleteCareProfileStep,
} from "../../hooks/useNextCareProfileStep"

export default function CareProfileSetupIndicator() {
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user) || {}

  const firstIncompleteRoute = getFirstIncompleteCareProfileStep(user)

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Personalize your care"
      onBack={() => navigate(-1)}
      pageTitle="Personalize your care"
      description="Tell us about your health needs so we can connect you with the right providers and tailored offers."
      headerIcon={
        <img
          src={careProfileSetup} // Using verified tile as it fits "Jireh profile"
          alt="Jireh Profile"
          className={HEADER_ICON}
        />
      }
      headerAction={
        <div className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 mt-2">
          <Clock size={14} />
          Only takes 2mins!
        </div>
      }
      showStepper={false}
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
      <div className="flex flex-col gap-2 w-full">
        <p className="text-muted-foreground text-sm font-medium">
          Information being collected:
        </p>
        <ItemGroup className="gap-1.5">
          {CARE_PROFILE_STEP_CONFIG.map((step) => {
            const isCompleted = step.checkCompletion(user)

            return (
              <Item
                key={step.id}
                size="sm"
                variant="outline"
                className={cn(isCompleted && "bg-success border-success-solid")}
              >
                <ItemContent className="flex-row items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {step.id}
                  </span>
                  <ItemTitle className="text-foreground">
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
              </Item>
            )
          })}
        </ItemGroup>
      </div>
    </PatientPageWrapper>
  )
}
