import { Loader } from "lucide-react"

export default function LoadingPage() {
  return (
    <div className="grid w-full min-h-screen place-items-center">
      <Loader className="w-10 h-10 animate-spin-slow text-primary" />
    </div>
  )
}
