import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addPreferredProvider, removePreferredProvider } from "./searchApi"

interface Args {
  facilityId: number
  nextFavorite: boolean
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ facilityId, nextFavorite }: Args) =>
      nextFavorite
        ? addPreferredProvider(facilityId)
        : removePreferredProvider(facilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discovery", "preferred-providers"],
      })
    },
  })
}
