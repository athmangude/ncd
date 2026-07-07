import { useLocation, useNavigate, matchPath } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"

// Define the shape of a Care Profile Step
export interface CareProfileStep {
  id: string
  label: string
  route: string
  checkCompletion: (user: any) => boolean
}

// Define the steps configuration
export const CARE_PROFILE_STEP_CONFIG: CareProfileStep[] = [
    {
      id: "01",
      label: "Your insurance providers",
      route: "/patients/select-Insurance",
      checkCompletion: (user: any) => user.insuranceProviders?.length > 0
    },
    {
      id: "02",
      label: "Your preferred hospitals",
      route: "/patients/select-favorite-care-providers",
      checkCompletion: (user: any) => user.favoriteCareProviders?.length > 0
    },
    {
      id: "03",
      label: "Your health priorities",
      route: "/patients/healthcare-focus",
      checkCompletion: (user: any) => user.focusAreas?.length > 0
    },
     {
      id: "04",
      label: "Your health status",
      route: "/patients/ncd-status",
      checkCompletion: (user: any) => user.ncdStatus !== null
    }
]

// Export simple array of routes for compatibility
export const CARE_PROFILE_STEPS = CARE_PROFILE_STEP_CONFIG.map(step => step.route)

// Helper to get steps for a specific user
export const getCareProfileSteps = (_user: any): CareProfileStep[] => CARE_PROFILE_STEP_CONFIG

// Determine the first incomplete step
export const getFirstIncompleteCareProfileStep = (user: any): string | null => {
  const steps = getCareProfileSteps(user)
  const firstIncomplete = steps.find(step => !step.checkCompletion(user))
  return firstIncomplete ? firstIncomplete.route : null
}

const stepEndpoints: { [key: string]: string } = {
  "/patients/select-Insurance": "/patients/submit-insurance-providers",
  "/patients/select-favorite-care-providers": "/patients/submit-favorite-care-providers",
  "/patients/healthcare-focus": "/patients/submit-focus-areas",
  "/patients/ncd-status": "/patients/ncd-status",
}

const orgRoutes: { [key: string]: string } = {
  "/patients/healthcare-focus": "/patients/review-membership-details",
}

export default function useNextCareProfileStep() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const user = usePatientAuthStore((state: any) => state.user) || {}
  const patientType = user.type

  const steps = getCareProfileSteps(user)
  
  // Calculate next route logic
  let nextRoute = "/patients/" // Default fallback

  const currentStepIndex = steps.findIndex(step => 
    matchPath({ path: step.route, end: true }, location.pathname)
  )

  if (currentStepIndex !== -1) {
    // We are on a step. Find the NEXT incomplete step.
    let foundNext = false
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
        if (!steps[i].checkCompletion(user)) {
            nextRoute = steps[i].route
            foundNext = true
            break
        }
    }
    
    // If no subsequent incomplete step found, check if ALL steps are complete (including current/previous)
    if (!foundNext) {
       const allStepsComplete = steps.every(step => step.checkCompletion(user))

       if (allStepsComplete) {
          nextRoute = "/patients/care-profile-success"
       } else {
          nextRoute = "/patients/"
       }
    }
  } else {
     // If not on a known step, maybe we should direct to the first incomplete step?
     // Or preserve original behavior for "ORG" specific routes which might be outside the main flow.
      if (patientType === "ORG" && orgRoutes[location.pathname]) {
        nextRoute = orgRoutes[location.pathname]
      }
  }

  // Handle "ORG" override if it applies to the current step and we found a next step that isn't the org route
  // The original logic strictly followed the map.
  // If we are at /patients/healthcare-focus (step 3), next is step 4 (ncd-status).
  // But for ORG, it was review-membership-details.
  // We should respect that if valid.
  if (patientType === "ORG" && orgRoutes[location.pathname]) {
      // If the standard logic found a next step, we might need to override it?
      // Or does orgRoutes imply skipping ncd-status?
      // If orgRoutes maps healthcare-focus -> review, then ncd-status is skipped.
      nextRoute = orgRoutes[location.pathname]
  }

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = stepEndpoints[location.pathname]
      if (!endpoint) {
        // If no endpoint is defined for this step, just return null (or handle as needed)
        return null
      }
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + endpoint,
        data
      )
      return response.data
    },
    onSuccess: (data) => {
        // If the endpoint returned a specific redirect or action, handle it here
        // For now, we proceed to nextRoute
        if (nextRoute) {
            navigate(nextRoute, { state: data }) // Pass response data to next state if needed
        }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const skipStep = () => {
    if (nextRoute) {
      navigate(nextRoute)
    }
  }

  return {
    nextRoute,
    submitStep: mutation.mutate,
    skipStep,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  }
}
