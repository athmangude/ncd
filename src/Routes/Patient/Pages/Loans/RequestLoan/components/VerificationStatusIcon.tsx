import { FileText } from "lucide-react"
import clock from "@/assets/icons/clock.png"

export default function VerificationStatusIcon() {
  return (
    <div className="relative">
      <FileText className="w-20 h-20 text-neutral-300" strokeWidth={1} />
      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
        <img
          src={clock}
          alt="Invoice"
          className="w-24 h-24 object-contain"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
