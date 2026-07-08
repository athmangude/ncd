import React from "react"
import AppShell from "@/Routes/AppShell"

/**
 * Page shell for standalone, chrome-less status screens — loading, error,
 * unauthorized, invalid-tenant, verify-email. These are NOT portal screens
 * (no back bar, no footer CTA); they present a single centered message inside
 * the canonical `AppShell` frame with both slots suppressed.
 *
 * Encapsulating the `header={null} footer={null}` AppShell call here means these
 * pages don't import `AppShell` directly, so the shell stays a private
 * primitive that only the archetype wrappers touch.
 */
export default function StatusPageWrapper({
  children,
  bodyPadding = "default",
  className,
  cardClassName,
}: {
  children: React.ReactNode
  /** Body padding. "none" for full-bleed message layouts (e.g. PageMessageWrapper). */
  bodyPadding?: "default" | "none"
  /** Extra classes on the scrolling body (e.g. `grid place-items-center`). */
  className?: string
  /** Escape hatch for the centered card container. */
  cardClassName?: string
}) {
  return (
    <AppShell
      header={null}
      footer={null}
      bodyPadding={bodyPadding}
      className={className}
      cardClassName={cardClassName}
    >
      {children}
    </AppShell>
  )
}
