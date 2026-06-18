import { useQuery } from "@tanstack/react-query"
import { fetchRecentSearches } from "./searchApi"

export function useRecentSearches() {
  return useQuery({
    queryKey: ["discovery", "recent-searches"],
    queryFn: fetchRecentSearches,
    staleTime: 60_000,
  })
}
