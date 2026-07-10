import { cn } from "@/lib/utils"
import { formatMoney } from "@/utilities/currencyUtilities"

const SIZE_CLASSES = {
  sm: "text-sm tracking-normal",
  base: "text-base tracking-normal",
  lg: "text-lg tracking-normal",
  xl: "text-xl tracking-normal",
  hero: "text-[length:var(--fluid-amount-text)] tracking-[-0.01em]",
} as const

const WEIGHT_CLASSES = {
  regular: "font-normal",
  bold: "font-medium",
} as const

interface AmountProps {
  value: number
  currency?: string
  size?: keyof typeof SIZE_CLASSES
  weight?: keyof typeof WEIGHT_CLASSES
  includeDecimals?: boolean
  className?: string
  "data-testid"?: string
}

/**
 * Canonical display for monetary values (loan balances, transaction lists).
 * Geist Mono per brand, tabular-nums so amounts align in list columns.
 */
export function Amount({
  value,
  currency = "KES",
  size = "base",
  weight = "regular",
  includeDecimals = false,
  className,
  "data-testid": dataTestId,
}: AmountProps) {
  return (
    <span
      data-testid={dataTestId}
      className={cn(
        "font-mono leading-none [font-variant-numeric:tabular-nums]",
        SIZE_CLASSES[size],
        WEIGHT_CLASSES[weight],
        className
      )}
    >
      {formatMoney(value, currency, includeDecimals)}
    </span>
  )
}
