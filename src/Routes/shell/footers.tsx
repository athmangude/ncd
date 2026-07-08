import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"

// ─── Footer slot components ───────────────────────────────────────────────────
// Pinned bottom bars for the AppShell `footer` slot. Safe-area bottom inset is
// applied by AppShell, so these components only describe the bar itself.

interface PrimaryCTAFooterProps {
  label: React.ReactNode
  onClick?: () => void
  type?: "submit" | "button" | "reset"
  form?: string
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function PrimaryCTAFooter({
  label,
  onClick,
  type = "button",
  form,
  disabled,
  isLoading,
  className,
}: PrimaryCTAFooterProps) {
  return (
    <div
      className={cn(
        "border-t bg-white dark:bg-neutral-950 flex items-center p-4",
        className
      )}
    >
      <Button
        className="w-full"
        onClick={onClick}
        type={type}
        form={form}
        disabled={disabled ?? isLoading}
        isLoading={isLoading}
      >
        {label}
      </Button>
    </div>
  )
}

interface DualActionFooterProps {
  primary: {
    label: React.ReactNode
    /** Optional when the primary submits a form via `form`+`type="submit"`. */
    onClick?: () => void
    type?: "submit" | "button" | "reset"
    form?: string
    disabled?: boolean
    isLoading?: boolean
  }
  secondary: {
    label: React.ReactNode
    onClick?: () => void
    type?: "submit" | "button" | "reset"
    form?: string
    disabled?: boolean
  }
  className?: string
}

export function DualActionFooter({
  primary,
  secondary,
  className,
}: DualActionFooterProps) {
  return (
    <div
      className={cn(
        "border-t bg-white dark:bg-neutral-950 flex items-center p-4 gap-2",
        className
      )}
    >
      <Button
        variant="outline"
        onClick={secondary.onClick}
        type={secondary.type ?? "button"}
        form={secondary.form}
        disabled={secondary.disabled}
      >
        {secondary.label}
      </Button>
      <Button
        className="w-full"
        onClick={primary.onClick}
        type={primary.type ?? "button"}
        form={primary.form}
        disabled={primary.disabled ?? primary.isLoading}
        isLoading={primary.isLoading}
      >
        {primary.label}
      </Button>
    </div>
  )
}
