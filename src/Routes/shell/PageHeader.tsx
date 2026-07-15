import React from "react"
import { cn } from "@/lib/utils"

// ─── Main content header ──────────────────────────────────────────────────────
// A page-level header that lives inside the AppShell content area (the first
// child of the scrolling body), NOT in the pinned app bar. It carries an
// optional leading visual, the page title + description, an optional help/action
// pill, and — for multi-step flows — the progress stepper. Not sticky, no
// border; it scrolls with the content. Mirrors the design system's "form
// header".

/**
 * Canonical sizes for icons/illustrations in a content header. Use these instead
 * of hand-picking widths so the header visuals stay consistent across screens:
 *
 * - `HEADER_ICON` (40×40) — functional/inline glyphs (e.g. a patient or invoice
 *   icon that labels the step). Matches the app-bar action-button size.
 * - `HERO_ILLUSTRATION` (96×96) — celebratory / status art on success, error and
 *   invite screens, where a larger illustration is the point.
 */
export const HEADER_ICON = "w-10 h-10 object-contain"
export const HERO_ILLUSTRATION = "w-24 h-24 object-contain"

interface PageHeaderProps {
  /** Optional leading visual (icon/illustration), rendered above the title. */
  icon?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  /** Optional help/action element, e.g. a "What is a Circle?" pill. */
  action?: React.ReactNode
  /** A <Stepper/> element, rendered above the title for multi-step flows. */
  stepper?: React.ReactNode
  /** Alignment of the block. Defaults to "center" to match the form header. */
  align?: "center" | "start"
  className?: string
}

export function PageHeader({
  icon,
  title,
  description,
  action,
  stepper,
  align = "center",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className
      )}
    >
      {icon && <div>{icon}</div>}
      {stepper && <div className="w-full">{stepper}</div>}
      {title && <h1 className="whitespace-pre-line">{title}</h1>}
      {description && (
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
