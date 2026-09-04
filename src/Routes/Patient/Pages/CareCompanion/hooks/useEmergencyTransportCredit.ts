import { useQuery } from "@tanstack/react-query"
import type { EmergencyTransportCredit } from "@/types/care-companion"

export type EmergencyTransportCreditData = EmergencyTransportCredit

export const emergencyTransportCreditQueryKey =
  "careCompanionEmergencyTransportCredit"

export function useEmergencyTransportCredit() {
  return useQuery({
    queryKey: [emergencyTransportCreditQueryKey],
    queryFn: async () => {
      return {
        available: true,
        remainingAmount: "500",
        currency: "KES",
        maxAmount: "1000",
        usedAmount: "500",
      } as unknown as EmergencyTransportCreditData
    },
    staleTime: 10 * 60 * 1000,
  })
}
