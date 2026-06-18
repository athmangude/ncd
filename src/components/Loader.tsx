import { cn } from "@/lib/utils"
import { Loader as LoaderIcon } from "lucide-react"

export default function Loader({ className }: { className?: string }) {
  return (
    <LoaderIcon
      className={cn("w-10 h-10 animate-spin-slow text-primary", className)}
    />
  )
}
