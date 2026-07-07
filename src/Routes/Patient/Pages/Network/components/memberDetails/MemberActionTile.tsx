import { ChevronRight, type LucideIcon } from "lucide-react"

interface MemberActionTileProps {
  icon: LucideIcon
  label: string
  onClick: () => void
}

export function MemberActionTile({ icon: Icon, label, onClick }: MemberActionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl bg-purple-50 p-3 text-left hover:bg-purple-100"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-purple-700" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-purple-700" />
    </button>
  )
}
