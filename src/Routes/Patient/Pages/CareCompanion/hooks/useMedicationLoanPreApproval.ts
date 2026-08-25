import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface MedicationLoanPreApprovalData {
  isPreApproved: boolean
  maxLoanAmount: number
  currency: string
  interestRate: number
  repaymentPeriodDays: number
  eligibilityFactors: {
    factor: string
    status: "met" | "not-met" | "partial"
    description: string
  }[]
  estimatedMonthlyRepayment: number | null
  medicationsCovered: {
    medicationId: string
    medicationName: string
    estimatedCost: number
  }[]
}

export const medicationLoanPreApprovalQueryKey =
  "careCompanionMedicationLoanPreApproval"

export function useMedicationLoanPreApproval() {
  return useQuery({
    queryKey: [medicationLoanPreApprovalQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/medication-loan-pre-approval`
      )
      return response.data as MedicationLoanPreApprovalData
    },
    staleTime: 15 * 60 * 1000,
  })
}
