import { useQuery } from "@tanstack/react-query"
import { dataService } from "@/lib/data-service"
import type { CareCompanionProfile } from "@/types/care-companion"

export const intakeProfileQueryKey = "careCompanionIntakeProfile"

interface SupabaseProfileRow {
  id: string
  phone: string
  first_name: string | null
  conditions: string[] | null
  diagnosis_recency: string | null
  conditions_other_description: string | null
  treatment: Record<string, unknown> | null
  recurring_tests: Record<string, unknown> | null
  cost_estimates: Record<string, unknown> | null
  challenges: Record<string, unknown> | null
  coping: Record<string, unknown> | null
  goals: string[] | null
  user_role: string | null
  patient_relationship: string | null
  completed_at: string | null
}

function transformSupabaseRow(
  row: SupabaseProfileRow,
): CareCompanionProfile {
  const challenges = row.challenges as {
    items?: string[]
    selected?: string[]
    topChallenge?: string | null
  } | null
  const coping = row.coping as {
    items?: string[]
    informationSources?: string[]
    costCoping?: string | null
    hasEmergencyPlan?: boolean | null
    exerciseFrequency?: string | null
  } | null
  const treatment = row.treatment as {
    medicationNames?: string[]
    currentlyOnMedication?: boolean
    takingMedicationRegularly?: string | null
    reasonsForMissing?: string[]
    usingHerbalAlternatives?: boolean
    herbalDetails?: string | null
    dosages?: Record<string, string>
  } | null
  const costEstimates = row.cost_estimates as {
    medications?: { name: string; estimatedCostPerRefill?: number; monthlyCost?: number; refillFrequencyDays?: number }[]
    tests?: { name: string; estimatedCostPerTest?: number; cost?: number; frequencyMonths?: number; defaultFrequencyMonths?: number }[]
  } | null
  const recurringTests = row.recurring_tests as {
    selectedTests?: string[]
  } | null

  return {
    id: row.id,
    completedAt: row.completed_at,
    skippedAt: null,
    accountData: null,
    conditions: {
      type: (row.conditions ?? []) as CareCompanionProfile["conditions"]["type"],
      otherDescription: row.conditions_other_description ?? null,
      diagnosisRecency: (row.diagnosis_recency as CareCompanionProfile["conditions"]["diagnosisRecency"]) ?? null,
    },
    treatment: {
      currentlyOnMedication:
        treatment?.currentlyOnMedication ??
        (treatment?.medicationNames?.length ?? 0) > 0,
      medicationNames: treatment?.medicationNames ?? [],
      takingMedicationRegularly:
        (treatment?.takingMedicationRegularly as CareCompanionProfile["treatment"]["takingMedicationRegularly"]) ?? null,
      reasonsForMissing: (treatment?.reasonsForMissing ?? []) as CareCompanionProfile["treatment"]["reasonsForMissing"],
      usingHerbalAlternatives: treatment?.usingHerbalAlternatives ?? false,
      herbalDetails: treatment?.herbalDetails ?? null,
    },
    recurringTests: {
      selectedTests: recurringTests?.selectedTests ?? [],
    },
    costEstimates: {
      medications: (costEstimates?.medications ?? []).map((m) => ({
        name: m.name,
        refillFrequencyDays: m.refillFrequencyDays ?? 30,
        estimatedCostPerRefill: m.estimatedCostPerRefill ?? m.monthlyCost ?? 0,
      })),
      tests: (costEstimates?.tests ?? []).map((t) => ({
        name: t.name,
        frequencyMonths: t.frequencyMonths ?? t.defaultFrequencyMonths ?? 6,
        estimatedCostPerTest: t.estimatedCostPerTest ?? t.cost ?? 0,
      })),
    },
    challenges: {
      selected: (challenges?.selected ?? challenges?.items ?? []) as CareCompanionProfile["challenges"]["selected"],
      topChallenge:
        (challenges?.topChallenge as CareCompanionProfile["challenges"]["topChallenge"]) ??
        ((challenges?.selected ?? challenges?.items ?? [])[0] as CareCompanionProfile["challenges"]["topChallenge"]) ??
        null,
    },
    coping: {
      costCoping: (coping?.costCoping ?? null) as CareCompanionProfile["coping"]["costCoping"],
      informationSources: (coping?.informationSources ?? coping?.items ?? []) as CareCompanionProfile["coping"]["informationSources"],
      hasEmergencyPlan: coping?.hasEmergencyPlan ?? null,
      exerciseFrequency: (coping?.exerciseFrequency ?? null) as CareCompanionProfile["coping"]["exerciseFrequency"],
    },
    goals: {
      selected: (row.goals ?? []) as CareCompanionProfile["goals"]["selected"],
    },
    userRole: {
      role: (row.user_role?.toUpperCase() ?? "SELF") as CareCompanionProfile["userRole"]["role"],
      patientRelationship: (row.patient_relationship as CareCompanionProfile["userRole"]["patientRelationship"]) ?? null,
    },
  }
}

export function useIntakeProfile() {
  return useQuery({
    queryKey: [intakeProfileQueryKey],
    queryFn: async () => {
      const row = await dataService.query<SupabaseProfileRow | null>(
        "profiles",
        { single: true },
      )
      if (!row) return null
      return transformSupabaseRow(row)
    },
    staleTime: 10 * 60 * 1000,
  })
}
