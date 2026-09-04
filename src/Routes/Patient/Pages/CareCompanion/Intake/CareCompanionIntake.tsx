import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dataService } from "@/lib/data-service"

import { Button } from "@/components/Button"
import { trackEvent, EVENTS } from "@/analytics"
import { useCareCompanionStore } from "@/Routes/Patient/Pages/CareCompanion/store/careCompanionStore"
import { careCompanionProfileQueryKey } from "./hooks/useCareCompanionProfile"
import { medicationCardsQueryKey } from "../hooks/useMedicationCards"
import { useIntakeProfile, intakeProfileQueryKey } from "../hooks/useIntakeProfile"
import IntakeProgress from "./components/IntakeProgress"
import ConditionsStep from "./steps/ConditionsStep"
import TreatmentStep from "./steps/TreatmentStep"
import RecurringTestsStep from "./steps/RecurringTestsStep"
import CostEstimationStep from "./steps/CostEstimationStep"
import ChallengesStep from "./steps/ChallengesStep"
import CopingStep from "./steps/CopingStep"
import GoalsStep from "./steps/GoalsStep"
import UserRoleStep from "./steps/UserRoleStep"
import IntakeCompletionStep from "./steps/IntakeCompletionStep"
import type { CareCompanionProfile } from "@/types/care-companion"

const TOTAL_STEPS = 9

const DEFAULT_PROFILE: CareCompanionProfile = {
  id: "",
  completedAt: null,
  skippedAt: null,
  conditions: {
    type: [],
    otherDescription: null,
    diagnosisRecency: null,
  },
  accountData: null,
  treatment: {
    currentlyOnMedication: false,
    medicationNames: [],
    takingMedicationRegularly: null,
    reasonsForMissing: [],
    usingHerbalAlternatives: false,
    herbalDetails: null,
  },
  recurringTests: {
    selectedTests: [],
  },
  costEstimates: {
    medications: [],
    tests: [],
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

function inferResumeStep(p: CareCompanionProfile): number {
  if (p.conditions.type.length === 0) return 0
  if (!p.treatment.currentlyOnMedication && p.treatment.medicationNames.length === 0) return 1
  // Steps 2 (tests) and 3 (costs) are optional — use downstream
  // progress to decide if the user already passed them.
  if (p.challenges.selected.length === 0) {
    if (p.costEstimates.medications.length > 0 || p.costEstimates.tests.length > 0) return 4
    if (p.recurringTests.selectedTests.length > 0) return 3
    return 2
  }
  if (p.coping.informationSources.length === 0 && p.coping.costCoping === null) return 5
  if (p.goals.selected.length === 0) return 6
  if (!p.userRole.role || p.userRole.role === "SELF") return 7
  return 8
}

export default function CareCompanionIntake() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setIntakeCompleted = useCareCompanionStore(
    (s) => s.setIntakeCompleted,
  )

  const { data: existingProfile, isLoading: profileLoading } = useIntakeProfile()

  const saveProfile = useMutation({
    mutationFn: async (data: CareCompanionProfile) => {
      return dataService.update<CareCompanionProfile>("profiles", data.id, {
        conditions: data.conditions.type,
        diagnosis_recency: data.conditions.diagnosisRecency,
        conditions_other_description: data.conditions.otherDescription,
        treatment: data.treatment,
        recurring_tests: data.recurringTests,
        cost_estimates: data.costEstimates,
        challenges: data.challenges,
        coping: data.coping,
        goals: data.goals.selected,
        user_role: data.userRole.role?.toLowerCase(),
        patient_relationship: data.userRole.patientRelationship,
        completed_at: data.completedAt,
      } as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [careCompanionProfileQueryKey],
      })
      queryClient.invalidateQueries({
        queryKey: [intakeProfileQueryKey],
      })
      queryClient.invalidateQueries({
        queryKey: ["careCompanionHome"],
      })
      queryClient.invalidateQueries({
        queryKey: [medicationCardsQueryKey],
      })
    },
  })

  const topRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState<CareCompanionProfile>(DEFAULT_PROFILE)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (profileLoading || initialized) return
    if (existingProfile) {
      setProfile(existingProfile)
      if (!existingProfile.completedAt) {
        setCurrentStep(inferResumeStep(existingProfile))
      } else {
        setCurrentStep(0)
      }
    }
    setInitialized(true)
  }, [profileLoading, existingProfile, initialized])

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

  function isStepComplete(step: number): boolean {
    switch (step) {
      case 0: {
        if (profile.conditions.type.length === 0) return false
        if (profile.conditions.diagnosisRecency === null) return false
        if (profile.conditions.type.includes("OTHER") && !profile.conditions.otherDescription) return false
        return true
      }
      case 1: {
        const t = profile.treatment
        if (t.currentlyOnMedication) {
          if (t.medicationNames.length === 0) return false
          if (t.takingMedicationRegularly === null) return false
          if ((t.takingMedicationRegularly === "SOMETIMES" || t.takingMedicationRegularly === "RARELY") && t.reasonsForMissing.length === 0) return false
        }
        if (t.usingHerbalAlternatives && !t.herbalDetails) return false
        return true
      }
      case 2:
        return true
      case 3: {
        const hasMeds = profile.treatment.currentlyOnMedication && profile.treatment.medicationNames.length > 0
        const hasTests = profile.recurringTests.selectedTests.length > 0
        if (hasMeds && profile.costEstimates.medications.length === 0) return false
        if (hasTests && profile.costEstimates.tests.length === 0) return false
        return true
      }
      case 4:
        return (
          profile.challenges.selected.length > 0 &&
          profile.challenges.topChallenge !== null
        )
      case 5: {
        if (profile.coping.informationSources.length === 0) return false
        const ch = profile.challenges.selected
        if (ch.includes("COST") && (!profile.coping.costCoping || profile.coping.costCoping.length === 0)) return false
        if (ch.includes("EMERGENCY_PREPAREDNESS") && profile.coping.hasEmergencyPlan === null) return false
        if (ch.includes("EXERCISE") && profile.coping.exerciseFrequency === null) return false
        return true
      }
      case 6:
        return profile.goals.selected.length > 0
      case 7: {
        if (!profile.userRole.role) return false
        if ((profile.userRole.role === "CAREGIVER" || profile.userRole.role === "BOTH") && profile.userRole.patientRelationship === null) return false
        return true
      }
      default:
        return true
    }
  }

  function scrollToTop() {
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "instant", block: "start" })
    })
  }

  function handleNext() {
    trackEvent(EVENTS.CARE_COMPANION.INTAKE.STEP_COMPLETE, {
      step: currentStep,
    })
    saveProfile.mutate({ ...profile, completedAt: null })
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
    scrollToTop()
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    scrollToTop()
  }

  function handleComplete() {
    trackEvent(EVENTS.CARE_COMPANION.INTAKE.COMPLETE)
    const completed: CareCompanionProfile = {
      ...profile,
      completedAt: new Date().toISOString(),
    }
    saveProfile.mutate(completed)
    setIntakeCompleted(true)
    navigate("/patients/companion")
  }

  if (profileLoading || !initialized) {
    return <IntakeSkeleton />
  }

  const isCompletionStep = currentStep === 8
  const isFirstVisit = !existingProfile?.completedAt

  return (
    <div className="flex flex-col bg-background">
      <div ref={topRef} />
      {!isCompletionStep && (
        <div className="sticky top-0 z-10 bg-background px-4 pb-3 pt-4">
          {currentStep === 0 && (
            <div className="mb-4">
              <h1 className="text-lg font-semibold tracking-tight">
                {isFirstVisit
                  ? "Help us understand your health journey"
                  : "Update your health profile"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isFirstVisit
                  ? "A few quick questions so we can personalise your care plan, medication reminders, and cost insights."
                  : "Review and update your details to keep your care plan, reminders, and cost insights accurate."}
              </p>
            </div>
          )}
          <IntakeProgress
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS - 1}
          />
        </div>
      )}

      <div className="flex flex-col px-4 pb-4">
        <div>
          {currentStep === 0 && (
            <ConditionsStep
              data={profile.conditions}
              onUpdate={(data) => updateSection("conditions", data)}
            />
          )}
          {currentStep === 1 && (
            <TreatmentStep
              data={profile.treatment}
              conditions={profile.conditions.type}
              onUpdate={(data) => updateSection("treatment", data)}
            />
          )}
          {currentStep === 2 && (
            <RecurringTestsStep
              data={profile.recurringTests}
              conditions={profile.conditions.type}
              onUpdate={(data) => updateSection("recurringTests", data)}
            />
          )}
          {currentStep === 3 && (
            <CostEstimationStep
              medications={profile.treatment.medicationNames}
              tests={profile.recurringTests.selectedTests}
              data={profile.costEstimates}
              onUpdate={(data) => updateSection("costEstimates", data)}
            />
          )}
          {currentStep === 4 && (
            <ChallengesStep
              data={profile.challenges}
              onUpdate={(data) => updateSection("challenges", data)}
            />
          )}
          {currentStep === 5 && (
            <CopingStep
              data={profile.coping}
              challenges={profile.challenges.selected}
              onUpdate={(data) => updateSection("coping", data)}
            />
          )}
          {currentStep === 6 && (
            <GoalsStep
              data={profile.goals}
              onUpdate={(data) => updateSection("goals", data)}
            />
          )}
          {currentStep === 7 && (
            <UserRoleStep
              data={profile.userRole}
              onUpdate={(data) => updateSection("userRole", data)}
            />
          )}
          {currentStep === 8 && (
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
              <Button
                className="flex-1"
                onClick={handleNext}
                disabled={!isStepComplete(currentStep)}
              >
                {currentStep === 7 ? "Complete" : "Next"}
              </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function IntakeSkeleton() {
  return (
    <div className="flex flex-col bg-background animate-pulse">
      <div className="px-4 pb-3 pt-4">
        <div className="mb-4 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>

        <div className="flex gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-muted" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 pt-2">
        <div className="h-5 w-48 rounded bg-muted" />

        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border p-4"
            >
              <div className="h-5 w-5 rounded bg-muted shrink-0" />
              <div className="h-4 flex-1 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="h-10 w-full rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}
