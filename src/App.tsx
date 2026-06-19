import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/Toaster"
import RouterWrapper from "./RouterWrapper"
import { queryClient } from "./queryClient"

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <RouterWrapper />
    </QueryClientProvider>
  )
}
