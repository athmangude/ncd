import { QueryClient } from "@tanstack/react-query"

/**
 * The app's single React Query client. Lives in its own module so non-component
 * code (e.g. the facilitator panel's soft-refresh) can invalidate queries
 * against the same instance the provider uses, without a full page reload.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: false,
    },
  },
})
