import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import axios from "axios"

export interface CareCompanionProfileData {
  id: string
  patientId: string
  conditions: string[]
  medications: {
    name: string
    dosage: string
    frequency: string
  }[]
  diagnosisDate: string | null
  managingDoctor: string | null
  monthlyMedicationBudget: number | null
  budgetCurrency: string
  hasInsurance: boolean
  insuranceProvider: string | null
  challenges: string[]
  preferredPharmacyId: string | null
  preferredPharmacyName: string | null
  notificationPreferences: {
    refillReminders: boolean
    dosageReminders: boolean
    educationContent: boolean
    costAlerts: boolean
  }
  intakeCompletedAt: string | null
  skippedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCareCompanionProfilePayload = Omit<
  CareCompanionProfileData,
  "id" | "patientId" | "createdAt" | "updatedAt"
>

export type UpdateCareCompanionProfilePayload =
  Partial<CreateCareCompanionProfilePayload>

export const careCompanionProfileQueryKey = "careCompanionProfile"

export function useCareCompanionProfile() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [careCompanionProfileQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/profile`
      )
      return response.data as CareCompanionProfileData
    },
    staleTime: 5 * 60 * 1000,
  })

  const createProfile = useMutation({
    mutationFn: async (payload: CreateCareCompanionProfilePayload) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/companion/profile`,
        payload
      )
      return response.data as CareCompanionProfileData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [careCompanionProfileQueryKey],
      })
    },
  })

  const updateProfile = useMutation({
    mutationFn: async (payload: UpdateCareCompanionProfilePayload) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/companion/profile`,
        payload
      )
      return response.data as CareCompanionProfileData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [careCompanionProfileQueryKey],
      })
    },
  })

  return {
    ...query,
    createProfile,
    updateProfile,
  }
}
