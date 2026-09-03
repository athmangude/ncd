import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

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

function mapProfileRow(row: any): CareCompanionProfileData {
  return {
    id: row.id,
    patientId: row.id,
    conditions: row.conditions ?? [],
    medications: Array.isArray(row.treatment?.medications)
      ? row.treatment.medications
      : [],
    diagnosisDate: row.treatment?.diagnosisDate ?? null,
    managingDoctor: row.treatment?.managingDoctor ?? null,
    monthlyMedicationBudget:
      row.cost_estimates?.monthlyMedicationBudget ?? null,
    budgetCurrency: row.cost_estimates?.budgetCurrency ?? "KES",
    hasInsurance: row.cost_estimates?.hasInsurance ?? false,
    insuranceProvider: row.cost_estimates?.insuranceProvider ?? null,
    challenges: Array.isArray(row.challenges)
      ? row.challenges
      : Object.keys(row.challenges ?? {}),
    preferredPharmacyId: null,
    preferredPharmacyName: null,
    notificationPreferences: {
      refillReminders: true,
      dosageReminders: true,
      educationContent: true,
      costAlerts: true,
    },
    intakeCompletedAt: row.completed_at,
    skippedAt: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useCareCompanionProfile() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [careCompanionProfileQueryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .single()
      if (error) throw error
      return mapProfileRow(data)
    },
    staleTime: 5 * 60 * 1000,
  })

  const createProfile = useMutation({
    mutationFn: async (payload: CreateCareCompanionProfilePayload) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.user.id,
          phone: "",
          conditions: payload.conditions,
          treatment: { medications: payload.medications },
          cost_estimates: {
            monthlyMedicationBudget: payload.monthlyMedicationBudget,
            budgetCurrency: payload.budgetCurrency,
            hasInsurance: payload.hasInsurance,
            insuranceProvider: payload.insuranceProvider,
          },
          challenges: payload.challenges,
        })
        .select()
        .single()
      if (error) throw error
      return mapProfileRow(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [careCompanionProfileQueryKey],
      })
    },
  })

  const updateProfile = useMutation({
    mutationFn: async (payload: UpdateCareCompanionProfilePayload) => {
      const updateFields: Record<string, any> = {}
      if (payload.conditions) updateFields.conditions = payload.conditions
      if (payload.medications)
        updateFields.treatment = { medications: payload.medications }
      if (payload.challenges) updateFields.challenges = payload.challenges

      const { data, error } = await supabase
        .from("profiles")
        .update(updateFields)
        .select()
        .single()
      if (error) throw error
      return mapProfileRow(data)
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
