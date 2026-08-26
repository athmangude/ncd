import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import { trackEvent, EVENTS } from "@/analytics"
import { useCareCompanionStore } from "@/Routes/Patient/Pages/CareCompanion/store/careCompanionStore"
import IntakeProgress from "./components/IntakeProgress"
import ConditionsStep from "./steps/ConditionsStep"
import TreatmentStep from "./steps/TreatmentStep"
import ChallengesStep from "./steps/ChallengesStep"
import CopingStep from "./steps/CopingStep"
import GoalsStep from "./steps/GoalsStep"
import UserRoleStep from "./steps/UserRoleStep"
import IntakeCompletionStep from "./steps/IntakeCompletionStep"
import type { CareCompanionProfile } from "@/types/care-companion"

const TOTAL_STEPS = 7

const DEFAULT_PROFILE: CareCompanionProfile = {
  id: "",
  completedAt: null,
  skippedAt: null,
  conditions: {
    type: [],
    otherDescription: null,
    diagnosisRecency: null,
  },
  treatment: {
    currentlyOnMedication: false,
    medicationNames: [],
    takingMedicationRegularly: null,
    reasonsForMissing: [],
    usingHerbalAlternatives: false,
    herbalDetails: null,
  },
  challenges: {
    selected: [],
    topChallenge: null,
  },
  coping: {
    costCoping: null,
    informationSources: [],
    hasEmergencyPlan: null,
    exerciseFrequency: null,
  },
  goals: {
    selected: [],
  },
  userRole: {
    role: "SELF",
    patientRelationship: null,
  },
}

export default function CareCompanionIntake() {
  const navigate = useNavigate()
  const setIntakeCompleted = useCareCompanionStore(
    (s) => s.setIntakeCompleted,
  )

  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState<CareCompanionProfile>(DEFAULT_PROFILE)

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.INTAKE.VIEW)
  }, [])

  const updateSection = useCallback(
    <K extends keyof CareCompanionProfile>(
      section: K,
      data: CareCompanionProfile[K],
    ) => {
      setProfile((prev) => ({ ...prev, [section]: data }))
    },
    [],
  )

  function handleNext() {
    trackEvent(EVENTS.CARE_COMPANION.INTAKE.STEP_COMPLETE, {
      step: currentStep,
    })
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  function handleSkip() {
    trackEvent(EVENTS.CARE_COMPANION.INTAKE.SKIP)
    setIntakeCompleted(true)
    navigate("/patients/care")
  }

  function handleComplete() {
    trackEvent(EVENTS.CARE_COMPANION.INTAKE.COMPLETE)
    setIntakeCompleted(true)
    navigate("/patients/care")
  }

  const isCompletionStep = currentStep === 6

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {!isCompletionStep && (
        <div className="sticky top-0 z-10 bg-background px-4 pb-3 pt-4">
          <IntakeProgress
            currentStep={currentStep + 1}
            totalSteps={TOTAL_STEPS - 1}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="flex-1">
          {currentStep === 0 && (
            <ConditionsStep
              data={profile.conditions}
              onUpdate={(data) => updateSection("conditions", data)}
            />
          )}
          {currentStep === 1 && (
            <TreatmentStep
              data={profile.treatment}
              onUpdate={(data) => updateSection("treatment", data)}
            />
          )}
          {currentStep === 2 && (
            <ChallengesStep
              data={profile.challenges}
              onUpdate={(data) => updateSection("challenges", data)}
            />
          )}
          {currentStep === 3 && (
            <CopingStep
              data={profile.coping}
              challenges={profile.challenges.selected}
              onUpdate={(data) => updateSection("coping", data)}
            />
          )}
          {currentStep === 4 && (
            <GoalsStep
              data={profile.goals}
              onUpdate={(data) => updateSection("goals", data)}
            />
          )}
          {currentStep === 5 && (
            <UserRoleStep
              data={profile.userRole}
              onUpdate={(data) => updateSection("userRole", data)}
            />
          )}
          {currentStep === 6 && (
            <IntakeCompletionStep
              profile={profile}
              onComplete={handleComplete}
            />
          )}
        </div>

        {!isCompletionStep && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              <Button className="flex-1" onClick={handleNext}>
                {currentStep === 5 ? "Complete" : "Next"}
              </Button>
            </div>

            <button
              type="button"
              className="font-sans text-sm text-muted-foreground underline underline-offset-2"
              onClick={handleSkip}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
