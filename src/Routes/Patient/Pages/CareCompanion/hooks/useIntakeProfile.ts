import { useQuery } from "@tanstack/react-query"
import { dataService } from "@/lib/data-service"
import type { CareCompanionProfile } from "@/types/care-companion"

export const intakeProfileQueryKey = "careCompanionIntakeProfile"

export function useIntakeProfile() {
  return useQuery({
    queryKey: [intakeProfileQueryKey],
    queryFn: () =>
      dataService.query<CareCompanionProfile | null>("profiles", {
        single: true,
      }),
    staleTime: 10 * 60 * 1000,
  })
}
