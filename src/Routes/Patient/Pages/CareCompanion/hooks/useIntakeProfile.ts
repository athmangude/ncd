import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { CareCompanionProfile } from "@/types/care-companion"

export const intakeProfileQueryKey = "careCompanionIntakeProfile"

export function useIntakeProfile() {
  return useQuery({
    queryKey: [intakeProfileQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/profile`,
      )
      return response.data as CareCompanionProfile | null
    },
    staleTime: 10 * 60 * 1000,
  })
}
