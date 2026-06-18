import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/Toaster"
import RouterWrapper from "./RouterWrapper"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <RouterWrapper />
    </QueryClientProvider>
  )
}
