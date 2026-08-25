import { useState, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"

export interface IntakeStep0Data {
  conditions: string[]
}

export interface IntakeStep1Data {
  diagnosisDate: string | null
  managingDoctor: string | null
}

export interface IntakeStep2Data {
  takesMedication: boolean
  medications: {
    name: string
    dosage: string
    frequency: string
  }[]
}

export interface IntakeStep3Data {
  monthlyMedicationBudget: number | null
  budgetCurrency: string
  hasInsurance: boolean
  insuranceProvider: string | null
}

export interface IntakeStep4Data {
  challenges: string[]
  otherChallenge: string | null
}

export interface IntakeStep5Data {
  preferredPharmacyId: string | null
  preferredPharmacyName: string | null
  locationConsent: boolean
}

export interface IntakeStep6Data {
  notificationPreferences: {
    refillReminders: boolean
    dosageReminders: boolean
    educationContent: boolean
    costAlerts: boolean
  }
}

export type IntakeStepData =
  | IntakeStep0Data
  | IntakeStep1Data
  | IntakeStep2Data
  | IntakeStep3Data
  | IntakeStep4Data
  | IntakeStep5Data
  | IntakeStep6Data

export interface IntakeFormData {
  step0: IntakeStep0Data | null
  step1: IntakeStep1Data | null
  step2: IntakeStep2Data | null
  step3: IntakeStep3Data | null
  step4: IntakeStep4Data | null
  step5: IntakeStep5Data | null
  step6: IntakeStep6Data | null
}

const TOTAL_STEPS = 7

function getNextStepIndex(
  currentStep: number,
  formData: IntakeFormData
): number {
  // Step 2 branches: if medication is "no", skip medication detail steps
  if (currentStep === 2 && formData.step2?.takesMedication === false) {
    return 4
  }

  // Step 4 branches: if no challenges selected that require pharmacy preference,
  // skip step 5 (pharmacy selection)
  if (currentStep === 4) {
    const challenges = formData.step4?.challenges ?? []
    const needsPharmacy = challenges.some(
      (c) => c === "access-to-pharmacy" || c === "medication-cost"
    )
    if (!needsPharmacy) {
      return 6
    }
  }

  return currentStep + 1
}

function getPreviousStepIndex(
  currentStep: number,
  formData: IntakeFormData
): number {
  // Reverse branching: if coming back to step 4 from step 6 and pharmacy was skipped
  if (currentStep === 6) {
    const challenges = formData.step4?.challenges ?? []
    const needsPharmacy = challenges.some(
      (c) => c === "access-to-pharmacy" || c === "medication-cost"
    )
    if (!needsPharmacy) {
      return 4
    }
  }

  // Reverse branching: if coming back from step 4 and medication was "no"
  if (currentStep === 4 && formData.step2?.takesMedication === false) {
    return 2
  }

  return currentStep - 1
}

export function useIntakeForm() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formData, setFormData] = useState<IntakeFormData>({
    step0: null,
    step1: null,
    step2: null,
    step3: null,
    step4: null,
    step5: null,
    step6: null,
  })

  const updateStepData = useCallback(
    (stepIndex: number, data: IntakeStepData) => {
      setFormData((prev) => ({
        ...prev,
        [`step${stepIndex}`]: data,
      }))
    },
    []
  )

  const goForward = useCallback(() => {
    const nextStep = getNextStepIndex(currentStepIndex, formData)
    if (nextStep < TOTAL_STEPS) {
      setCurrentStepIndex(nextStep)
    }
  }, [currentStepIndex, formData])

  const goBack = useCallback(() => {
    const prevStep = getPreviousStepIndex(currentStepIndex, formData)
    if (prevStep >= 0) {
      setCurrentStepIndex(prevStep)
    }
  }, [currentStepIndex, formData])

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TOTAL_STEPS) {
      setCurrentStepIndex(stepIndex)
    }
  }, [])

  const skipIntake = useMutation({
    mutationFn: async () => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/profile`,
        { skippedAt: new Date().toISOString() }
      )
      return response.data
    },
  })

  const submitIntake = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/intake`,
        { formData }
      )
      return response.data
    },
  })

  const isFirstStep = currentStepIndex === 0
  const isLastStep = (() => {
    const nextStep = getNextStepIndex(currentStepIndex, formData)
    return nextStep >= TOTAL_STEPS
  })()

  return {
    currentStepIndex,
    formData,
    updateStepData,
    goForward,
    goBack,
    goToStep,
    isFirstStep,
    isLastStep,
    totalSteps: TOTAL_STEPS,
    skipIntake: skipIntake.mutate,
    isSkipping: skipIntake.isPending,
    submitIntake: submitIntake.mutate,
    isSubmitting: submitIntake.isPending,
    submitError: submitIntake.error,
  }
}
