import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleItemVariants = cva(
  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

/**
 * Single-select segmented control (a row of mutually-exclusive pills). Use for
 * filter toggles. Colour/shape come from the tokenised variants — never restyle
 * an item per call-site. Built on Radix ToggleGroup for keyboard + a11y.
 */
function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "flex items-center gap-1 rounded-xl bg-muted p-1",
        className
      )}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleItemVariants>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleItemVariants({ variant }), className)}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
