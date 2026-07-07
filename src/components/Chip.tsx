import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge, badgeVariants } from "./Badge"
import type { VariantProps } from "class-variance-authority"

type ChipVariant = VariantProps<typeof badgeVariants>["variant"]

interface ChipProps extends Omit<React.ComponentProps<"button">, "children"> {
  children: React.ReactNode
  /** Badge variant to paint the chip. Defaults to `secondary` (soft brand tint). */
  variant?: ChipVariant
  /**
   * When set, renders a trailing ✕ and calls this on its click. The chip's own
   * `onClick` still fires for taps on the label; the ✕ stops propagation so
   * remove and select stay distinct.
   */
  onRemove?: () => void
  /** Accessible label for the remove ✕ (e.g. `Remove ${label}`). */
  removeLabel?: string
}

/**
 * Interactive pill — a tappable/removable `Badge`. Use for filter chips,
 * inline action pills, and selectable tags. Renders a real `<button>` (keyboard
 * + focus for free via Badge's focus-visible ring). The colour/shape come from
 * the Badge variant — never restyle a chip per call-site; pick a variant.
 */
export function Chip({
  children,
  variant = "secondary",
  onRemove,
  removeLabel,
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <Badge
      asChild
      variant={variant}
      className={cn("cursor-pointer", className)}
    >
      <button type={type} {...props}>
        {children}
        {onRemove && (
          <X
            role="button"
            aria-label={removeLabel}
            className="ml-0.5 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          />
        )}
      </button>
    </Badge>
  )
}
