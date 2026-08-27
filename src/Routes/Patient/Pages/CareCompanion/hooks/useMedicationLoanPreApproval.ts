import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { MedicationLoanPreApproval } from "@/types/care-companion"

export const medicationLoanPreApprovalQueryKey =
  "careCompanionMedicationLoanPreApproval"

export function useMedicationLoanPreApproval() {
  return useQuery({
    queryKey: [medicationLoanPreApprovalQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/medication-loan-pre-approval`
      )
      return response.data as MedicationLoanPreApproval
    },
    staleTime: 15 * 60 * 1000,
  })
}
