import React from "react"
import AppShell from "@/Routes/AppShell"

// Back-compat surface: MobileWrapper is now a thin wrapper over AppShell, the
// canonical page shell. The slot sub-components live in src/Routes/shell/* and
// are re-exported here unchanged so existing imports keep working.
export { LogoHeader, BackTitleHeader } from "@/Routes/shell/headers"
export {
  NavFooter,
  PrimaryCTAFooter,
  DualActionFooter,
  type NavTab,
} from "@/Routes/shell/footers"

interface MobileWrapperProps {
  children: React.ReactNode
  /** Slot for the fixed top bar. Pass null to suppress entirely. */
  header?: React.ReactNode | null
  /** Slot for the fixed bottom area. Pass null to suppress entirely. */
  footer?: React.ReactNode | null
  className?: string
}

export default function MobileWrapper({
  children,
  header,
  footer,
  className,
}: MobileWrapperProps) {
  return (
    <AppShell header={header} footer={footer} className={className}>
      {children}
    </AppShell>
  )
}
