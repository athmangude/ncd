import AppShell from "@/Routes/AppShell"
import StepperHeader from "@/Routes/shell/StepperHeader"
import { cn } from "@/lib/utils"

export default function PatientPageWrapper({
  children,
  title,
  isRoot = false,
  className,
  showHelp = false,
  onBack,
  backIcon,
  rightAction,
  footer,
}: {
  children: React.ReactNode
  title?: string // Made optional as sometimes we might not want a title or it's empty
  isRoot?: boolean
  className?: string
  showHelp?: boolean
  onBack?: () => void
  backIcon?: React.ReactNode
  rightAction?: React.ReactNode
  /**
   * Optional pinned bottom action slot (e.g. PrimaryCTAFooter). When omitted the
   * screen keeps rendering its CTAs inline — migrating those to the footer is a
   * later, per-screen step.
   */
  footer?: React.ReactNode
}) {
  return (
    <AppShell
      header={
        <StepperHeader
          title={title}
          isRoot={isRoot}
          showHelp={showHelp}
          onBack={onBack}
          backIcon={backIcon}
          rightAction={rightAction}
        />
      }
      footer={footer}
      bodyPadding="default"
    >
      <section className={cn("flex flex-col w-full gap-5", className)}>
        {children}
      </section>
    </AppShell>
  )
}
