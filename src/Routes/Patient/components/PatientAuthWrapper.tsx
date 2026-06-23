import AppShell from "@/Routes/AppShell"
import { cn } from "@/lib/utils"
import fullLogo from "@/assets/icons/full-logo.svg"

/**
 * Page shell for the auth / onboarding screens (sign-in, PIN, ID flows). It now
 * composes the canonical `AppShell` so these screens get the same centered
 * full-height `max-w-md` card, neutral backdrop and iOS/PWA safe-area handling
 * as the rest of the app. The bespoke centered-logo header is kept verbatim in
 * the header slot (relocate, don't restyle).
 *
 * `children` render inside the existing `max-w-[400px]` content column so the
 * ~14 callers' layouts (which assume `flex flex-col gap-7`) stay unchanged.
 */
export default function PatientAuthWrapper({
  children,
  className,
  footer,
}: {
  children: React.ReactNode
  className?: string
  /** Optional pinned bottom action slot (e.g. PrimaryCTAFooter). */
  footer?: React.ReactNode
}) {
  return (
    <AppShell
      header={
        <header className="w-full max-w-[400px] mx-auto py-5 flex justify-center">
          <img src={fullLogo} alt="Jireh Logo" className="w-1/2" />
        </header>
      }
      footer={footer}
    >
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
