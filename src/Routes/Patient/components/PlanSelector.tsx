import { Check } from "lucide-react"

export default function PlanSelector({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`px-4 py-1 flex items-center rounded-full gap-1 ${isActive ? "bg-primary text-white font-medium " : "bg-neutral-100"}`}
      onClick={onClick}
    >
      {isActive && <Check className="w-5 h-5 " />}
      {label}
    </button>
  )
}
