import { Switch } from "@/components/Switch"

interface JirehPartnersToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
}

export function JirehPartnersToggle({
  checked,
  onChange,
}: JirehPartnersToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-white">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          Jireh Health partners
        </span>
        <span className="text-xs text-muted-foreground">
          Earn up to 5% cashback
        </span>
      </div>
      <Switch size="xs" checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
