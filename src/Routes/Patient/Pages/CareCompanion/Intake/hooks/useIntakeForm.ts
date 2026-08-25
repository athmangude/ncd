import { useReducer, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { careCompanionProfileQueryKey } from "./useCareCompanionProfile"

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

/** Type-safe mapping from step index to its data type */
export type StepDataMap = {
  0: IntakeStep0Data
  1: IntakeStep1Data
  2: IntakeStep2Data
  3: IntakeStep3Data
  4: IntakeStep4Data
  5: IntakeStep5Data
  6: IntakeStep6Data
}

const TOTAL_STEPS = 7

export function getNextStepIndex(
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

export function getPreviousStepIndex(
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

// ---------------------------------------------------------------------------
// Reducer — keeps formData and currentStepIndex in a single atomic state so
// that updateStepData + goForward can be dispatched together without stale
// closure issues.
// ---------------------------------------------------------------------------

interface IntakeState {
  currentStepIndex: number
  formData: IntakeFormData
}

type IntakeAction =
  | { type: "UPDATE_STEP_DATA"; stepIndex: number; data: IntakeStepData }
  | { type: "GO_FORWARD" }
  | { type: "GO_FORWARD_WITH_DATA"; stepIndex: number; data: IntakeStepData }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; stepIndex: number }

function intakeReducer(state: IntakeState, action: IntakeAction): IntakeState {
  switch (action.type) {
    case "UPDATE_STEP_DATA": {
      return {
        ...state,
        formData: {
          ...state.formData,
          [`step${action.stepIndex}`]: action.data,
        },
      }
    }
    case "GO_FORWARD": {
      const nextStep = getNextStepIndex(
        state.currentStepIndex,
        state.formData
      )
      if (nextStep < TOTAL_STEPS) {
        return { ...state, currentStepIndex: nextStep }
      }
      return state
    }
    case "GO_FORWARD_WITH_DATA": {
      const updatedFormData = {
        ...state.formData,
        [`step${action.stepIndex}`]: action.data,
      }
      const nextStep = getNextStepIndex(
        state.currentStepIndex,
        updatedFormData
      )
      if (nextStep < TOTAL_STEPS) {
        return {
          currentStepIndex: nextStep,
          formData: updatedFormData,
        }
      }
      return { ...state, formData: updatedFormData }
    }
    case "GO_BACK": {
      const prevStep = getPreviousStepIndex(
        state.currentStepIndex,
        state.formData
      )
      if (prevStep >= 0) {
        return { ...state, currentStepIndex: prevStep }
      }
      return state
    }
    case "GO_TO_STEP": {
      if (action.stepIndex >= 0 && action.stepIndex < TOTAL_STEPS) {
        return { ...state, currentStepIndex: action.stepIndex }
      }
      return state
    }
    default:
      return state
  }
}

const initialState: IntakeState = {
  currentStepIndex: 0,
  formData: {
    step0: null,
    step1: null,
    step2: null,
    step3: null,
    step4: null,
    step5: null,
    step6: null,
  },
}

export function useIntakeForm() {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(intakeReducer, initialState)

  const updateStepData = useCallback(
    <K extends keyof StepDataMap>(stepIndex: K, data: StepDataMap[K]) => {
      dispatch({ type: "UPDATE_STEP_DATA", stepIndex, data })
    },
    []
  )

  const goForward = useCallback(
    <K extends keyof StepDataMap>(stepData?: StepDataMap[K], stepIndex?: K) => {
      if (stepData !== undefined && stepIndex !== undefined) {
        dispatch({
          type: "GO_FORWARD_WITH_DATA",
          stepIndex,
          data: stepData,
        })
      } else {
        dispatch({ type: "GO_FORWARD" })
      }
    },
    []
  )

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" })
  }, [])

  const goToStep = useCallback((stepIndex: number) => {
    dispatch({ type: "GO_TO_STEP", stepIndex })
  }, [])

  const skipIntake = useMutation({
    mutationFn: async () => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/profile`,
        { skippedAt: new Date().toISOString() }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [careCompanionProfileQueryKey],
      })
    },
  })

  const submitIntake = useMutation({
    mutationFn: async (data: IntakeFormData) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/intake`,
        { formData: data }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [careCompanionProfileQueryKey],
      })
    },
  })

  const isFirstStep = state.currentStepIndex === 0
  const isLastStep = (() => {
    const nextStep = getNextStepIndex(state.currentStepIndex, state.formData)
    return nextStep >= TOTAL_STEPS
  })()

  return {
    currentStepIndex: state.currentStepIndex,
    formData: state.formData,
    updateStepData,
    goForward,
    goBack,
    goToStep,
    isFirstStep,
    isLastStep,
    totalSteps: TOTAL_STEPS,
    skipIntake: () => skipIntake.mutate(),
    isSkipping: skipIntake.isPending,
    submitIntake: () => submitIntake.mutate(state.formData),
    isSubmitting: submitIntake.isPending,
    submitError: submitIntake.error,
  }
}
