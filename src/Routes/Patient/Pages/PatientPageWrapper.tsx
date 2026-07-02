import React from "react"
import AppShell from "@/Routes/AppShell"
import StepperHeader from "@/Routes/shell/StepperHeader"
import { PageHeader } from "@/Routes/shell/PageHeader"
import { Stepper } from "@/components/Stepper"
import {
  useJourneyStepper,
  useJourneyStepMeta,
} from "@/Routes/shell/useJourneyStepper"
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
  bodyPadding = "default",
  variant = "legacy",
  pageTitle,
  description,
  headerAction,
  headerIcon,
  headerAlign = "center",
  showStepper = true,
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
  /**
   * Body padding. Defaults to "default" (the canonical p-4). Pass "none" for
   * full-bleed screens that manage their own edge spacing (e.g. an edge-to-edge
   * background), so the shell's p-4 doesn't stack on the screen's own padding.
   */
  bodyPadding?: "default" | "none"
  /**
   * Header layout. "legacy" (default) renders the title and progress stepper in
   * the pinned app bar — unchanged from before. "content" renders a slim app bar
   * (back + help + rightAction, no title, no border) and puts the title,
   * description and stepper in a content-level `PageHeader` — matching the design
   * system's form header.
   */
  variant?: "legacy" | "content"
  /**
   * Content-header title (variant="content"). Falls back to the current step's
   * config label when omitted; explicit copy always wins.
   */
  pageTitle?: React.ReactNode
  /** Content-header description (variant="content"). */
  description?: React.ReactNode
  /** Content-header help/action element, e.g. a "What is a Circle?" pill. */
  headerAction?: React.ReactNode
  /**
   * Content-header leading visual (variant="content"). Size it with the
   * `HEADER_ICON` / `HERO_ILLUSTRATION` tokens from PageHeader.
   */
  headerIcon?: React.ReactNode
  /** Content-header alignment. Defaults to "center". */
  headerAlign?: "center" | "start"
  /** Show the progress stepper for journey routes. Defaults to true. */
  showStepper?: boolean
}) {
  if (variant === "content") {
    return (
      <ContentVariant
        title={title}
        isRoot={isRoot}
        className={className}
        showHelp={showHelp}
        onBack={onBack}
        backIcon={backIcon}
        rightAction={rightAction}
        footer={footer}
        bodyPadding={bodyPadding}
        pageTitle={pageTitle}
        description={description}
        headerAction={headerAction}
        headerIcon={headerIcon}
        headerAlign={headerAlign}
        showStepper={showStepper}
      >
        {children}
      </ContentVariant>
    )
  }

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
      bodyPadding={bodyPadding}
    >
      <section className={cn("flex flex-col w-full gap-5", className)}>
        {children}
      </section>
    </AppShell>
  )
}

/**
 * The content-header layout: a slim, borderless app bar (never carries a title,
 * so it can't collide with the content header) plus a `PageHeader` as the first
 * child of the scrolling body. Split into its own component so the journey hooks
 * are only called on this path.
 */
function ContentVariant({
  children,
  title,
  isRoot,
  className,
  showHelp,
  onBack,
  backIcon,
  rightAction,
  footer,
  bodyPadding,
  pageTitle,
  description,
  headerAction,
  headerIcon,
  headerAlign,
  showStepper,
}: {
  children: React.ReactNode
  title?: string
  isRoot?: boolean
  className?: string
  showHelp?: boolean
  onBack?: () => void
  backIcon?: React.ReactNode
  rightAction?: React.ReactNode
  footer?: React.ReactNode
  bodyPadding?: "default" | "none"
  pageTitle?: React.ReactNode
  description?: React.ReactNode
  headerAction?: React.ReactNode
  headerIcon?: React.ReactNode
  headerAlign: "center" | "start"
  showStepper: boolean
}) {
  const stepper = useJourneyStepper()
  const meta = useJourneyStepMeta()

  const resolvedTitle = pageTitle ?? title ?? meta.title
  const resolvedDescription = description ?? meta.description

  return (
    <AppShell
      header={
        <StepperHeader
          isRoot={isRoot}
          showHelp={showHelp}
          onBack={onBack}
          backIcon={backIcon}
          rightAction={rightAction}
          border={false}
          showStepper={false}
        />
      }
      footer={footer}
      bodyPadding={bodyPadding}
    >
      <section className={cn("flex flex-col w-full gap-5", className)}>
        <PageHeader
          icon={headerIcon}
          title={resolvedTitle}
          description={resolvedDescription}
          action={headerAction}
          align={headerAlign}
          stepper={
            showStepper && stepper ? (
              <Stepper
                currentStep={stepper.currentStep}
                totalSteps={stepper.totalSteps}
                completedSteps={stepper.completedSteps}
              />
            ) : undefined
          }
        />
        {children}
      </section>
    </AppShell>
  )
}
