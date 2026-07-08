import AppShell from "@/Routes/AppShell"
import { cn } from "@/lib/utils"
import { LogoHeader } from "@/Routes/shell/headers"
import { PrimaryCTAFooter, DualActionFooter } from "@/Routes/shell/footers"
import type {
  PrimaryCta,
  DualCta,
} from "@/Routes/Patient/Pages/PatientPageWrapper"

/**
 * Page shell for the auth / onboarding screens (sign-in, PIN, ID flows). It
 * composes the canonical `AppShell` so these screens get the same centered
 * full-height `max-w-md` card, neutral backdrop and iOS/PWA safe-area handling
 * as the rest of the app. The header is the canonical `LogoHeader`
 * (bordered/blurred/sticky bar) with the WhatsApp/bell cluster suppressed —
 * so the auth bar matches every other app bar's chrome.
 *
 * `children` render inside the existing `max-w-[400px]` content column so the
 * ~14 callers' layouts (which assume `flex flex-col gap-7`) stay unchanged.
 */
export default function PatientAuthWrapper({
  children,
  className,
  footer,
  primaryCta,
  dualCta,
}: {
  children: React.ReactNode
  className?: string
  /** Optional pinned bottom action slot (e.g. PrimaryCTAFooter). */
  footer?: React.ReactNode
  /** Declarative single primary CTA → PrimaryCTAFooter. Ignored if `footer` set. */
  primaryCta?: PrimaryCta
  /** Declarative primary + secondary CTAs → DualActionFooter. Ignored if `footer` set. */
  dualCta?: DualCta
}) {
  const resolvedFooter = footer ? (
    footer
  ) : dualCta ? (
    <DualActionFooter primary={dualCta.primary} secondary={dualCta.secondary} />
  ) : primaryCta ? (
    <PrimaryCTAFooter {...primaryCta} />
  ) : undefined

  return (
    <AppShell header={<LogoHeader showIcons={false} />} footer={resolvedFooter}>
      <section
        className={cn(
          "max-w-[400px] mx-auto rounded-sm w-full flex flex-col gap-7",
          className
        )}
      >
        {children}
      </section>
    </AppShell>
  )
}
