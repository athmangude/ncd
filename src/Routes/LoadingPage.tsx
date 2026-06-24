import { Loader } from "lucide-react"
import AppShell from "@/Routes/AppShell"

export default function LoadingPage() {
  return (
    <AppShell header={null} footer={null} className="grid place-items-center">
      <Loader className="w-10 h-10 animate-spin-slow text-primary" />
    </AppShell>
  )
}
