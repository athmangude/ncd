"use client"

import * as React from "react"
import { AlertDialog } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"

export const ConfirmDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialog.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
ConfirmDialogOverlay.displayName = AlertDialog.Overlay.displayName

/**
 * Exported alongside `ConfirmDialogOverlay` so call sites whose action set
 * doesn't fit ConfirmDialog's fixed Confirm/Cancel API (e.g. a real 2-choice
 * decision, neither option being "cancel") can still get the same
 * non-dismissible AlertDialog behavior/styling without duplicating these
 * class strings. See `PWAOnboarding/InstallAppPage.tsx`'s "Skip
 * Installation?" dialog for the reference usage.
 */
export const ConfirmDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialog.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialog.Content>
>(({ className, children, ...props }, ref) => (
  <AlertDialog.Portal>
    <ConfirmDialogOverlay />
    <AlertDialog.Content
      ref={ref}
      className={cn(
        // max-w-md matches DialogContent's own convention (see Dialog.tsx) —
        // ConfirmDialog itself always overrides via sm:max-w-[425px], but any
        // direct ConfirmDialogContent consumer (the escape hatch for
        // non-Confirm/Cancel shapes, e.g. InstallAppPage.tsx's "Skip
        // Installation?") should still match the app-wide default width.
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-max(2rem,var(--safe-l))-max(2rem,var(--safe-r)))] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </AlertDialog.Content>
  </AlertDialog.Portal>
))
ConfirmDialogContent.displayName = AlertDialog.Content.displayName

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  isLoading?: boolean
  /** Extra content rendered between the description and the action buttons (e.g. a PaymentDetailsCard). */
  children?: React.ReactNode
  className?: string
}

/**
 * Shared confirmation dialog for destructive/abandon-flow actions (cancel a
 * payment request, exit verification, etc). Built on Radix AlertDialog (not
 * plain Dialog) so outside-click can't accidentally dismiss it — the correct
 * semantics when dismissal would abandon a real loan/payment flow.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  children,
  className,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <ConfirmDialogContent className={cn("sm:max-w-[425px]", className)}>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <AlertDialog.Title className="text-2xl font-semibold leading-none tracking-tight">
            {title}
          </AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          )}
        </div>

        {children}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialog.Cancel asChild>
            <Button variant="outline" disabled={isLoading}>
              {cancelLabel}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action asChild>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Action>
        </div>
      </ConfirmDialogContent>
    </AlertDialog.Root>
  )
}
