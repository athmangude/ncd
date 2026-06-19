import React from "react"
import { cn } from "@/lib/utils"

export interface AppShellProps {
  children: React.ReactNode
  /** Pinned top slot. Pass null to suppress entirely. */
  header?: React.ReactNode | null
  /** Pinned bottom slot. Pass null to suppress entirely. */
  footer?: React.ReactNode | null
  /** Body padding. "default" = p-4 (the canonical body spacing); "none" = full-bleed. */
  bodyPadding?: "default" | "none"
  /** Whether the body scrolls internally (flex-1 + overflow-y-auto). */
  scroll?: boolean
  /** Extra classes merged onto <main>. */
  className?: string
  /** Escape hatch for extra classes on the centered card container. */
  cardClassName?: string
}

/**
 * The canonical page shell for the whole app: a neutral backdrop with a centered
 * full-height `max-w-md` card (identical on mobile and desktop), a pinned header
 * slot, an internally-scrolling body, and a pinned footer slot — so the top app
 * bar and bottom actions are always visible in the viewport.
 *
 * Safe-area insets (iOS / installed PWA) are handled here so individual screens
 * don't have to: the header slot clears the notch, and the bottom inset is owned
 * by the footer when present, otherwise by the body so the last item clears the
 * home indicator.
 */
export default function AppShell({
  children,
  header,
  footer,
  bodyPadding = "default",
  scroll = true,
  className,
  cardClassName,
}: AppShellProps) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-neutral-100 dark:bg-neutral-900">
      <div
        className={cn(
          "w-full max-w-md bg-white dark:bg-neutral-950 overflow-hidden flex flex-col relative h-[100dvh]",
          cardClassName
        )}
      >
        {header != null && <div className="shrink-0 safe-pt">{header}</div>}
        <main
          className={cn(
            scroll ? "flex-1 overflow-y-auto" : "flex-1",
            "no-scrollbar",
            bodyPadding === "default" && "p-4",
            // When there is no footer, the body owns the bottom safe-area inset
            // so its last item clears the home indicator.
            footer == null && "safe-pb",
            className
          )}
        >
          {children}
        </main>
        {footer != null && <div className="shrink-0 safe-pb">{footer}</div>}
      </div>
    </div>
  )
}
