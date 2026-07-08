import { Loader } from "lucide-react"
import StatusPageWrapper from "@/Routes/shell/StatusPageWrapper"

export default function LoadingPage() {
  return (
    <StatusPageWrapper className="grid place-items-center">
      <Loader className="w-10 h-10 animate-spin-slow text-primary" />
    </StatusPageWrapper>
  )
}
