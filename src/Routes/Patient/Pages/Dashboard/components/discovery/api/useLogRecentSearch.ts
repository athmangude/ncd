import { useMutation, useQueryClient } from "@tanstack/react-query"
import { logRecentSearch } from "./searchApi"

export function useLogRecentSearch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (facilityId: number) => logRecentSearch(facilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discovery", "recent-searches"],
      })
    },
  })
}
