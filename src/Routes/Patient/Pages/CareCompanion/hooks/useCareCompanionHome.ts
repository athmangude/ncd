import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { CareCompanionHome } from "@/types/care-companion"

export const careCompanionHomeQueryKey = "careCompanionHome"

export function useCareCompanionHome() {
  return useQuery({
    queryKey: [careCompanionHomeQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/companion/home`
      )
      return response.data as CareCompanionHome
    },
    staleTime: 5 * 60 * 1000,
  })
}
