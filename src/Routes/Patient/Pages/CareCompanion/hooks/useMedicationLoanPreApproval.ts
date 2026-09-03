import { useQuery } from "@tanstack/react-query"
import type { MedicationLoanPreApproval } from "@/types/care-companion"

export const medicationLoanPreApprovalQueryKey =
  "careCompanionMedicationLoanPreApproval"

export function useMedicationLoanPreApproval() {
  return useQuery({
    queryKey: [medicationLoanPreApprovalQueryKey],
    queryFn: async () => {
      return {
        isPreApproved: false,
        preApprovedAmount: "0",
        currency: "KES",
        expiresAt: null,
      } as unknown as MedicationLoanPreApproval
    },
    staleTime: 15 * 60 * 1000,
  })
}
