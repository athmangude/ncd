import { useQuery } from "@tanstack/react-query"
import { fetchPreferredProviders } from "./searchApi"

export function usePreferredProviders() {
  return useQuery({
    queryKey: ["discovery", "preferred-providers"],
    queryFn: fetchPreferredProviders,
    staleTime: 60_000,
  })
}
