import { cn } from "@/lib/utils"
export default function AmountContainer({
  leftText,
  rightText,
  leftClassName,
  rightClassName,
  strikethoughText,
}: {
  leftText: string
  rightText: string
  isUppercase?: boolean
  leftClassName?: string
  rightClassName?: string
  strikethoughText?: string
}) {
  return (
    <div
      className={cn(
        "flex justify-between text-muted-foreground font-light ",
        leftClassName
      )}
    >
      {leftText}
      <p className="flex gap-1">
        <span
          className={cn(
            "font-medium text-black pl-6 text-right",
            rightClassName
          )}
        >
          {rightText}
        </span>

        {strikethoughText && (
          <span className="text-muted-foreground line-through">{strikethoughText}</span>
        )}
      </p>
    </div>
  )
}
