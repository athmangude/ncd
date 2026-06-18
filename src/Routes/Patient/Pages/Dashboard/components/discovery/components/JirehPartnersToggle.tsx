import { cn } from "@/lib/utils"

interface JirehPartnersToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
}

export function JirehPartnersToggle({
  checked,
  onChange,
}: JirehPartnersToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          Jireh Health partners
        </span>
        <span className="text-xs text-muted-foreground">
          Earn up to 5% cashback
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "h-[22px] w-[40px] rounded-full relative transition-colors shrink-0",
          checked ? "bg-primary" : "bg-neutral-300",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform",
            checked ? "left-[20px]" : "left-[2px]",
          )}
        />
      </button>
    </div>
  )
}
