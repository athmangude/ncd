import React from "react"
import AppShell from "@/Routes/AppShell"
import StepperHeader from "@/Routes/shell/StepperHeader"
import { PageHeader } from "@/Routes/shell/PageHeader"
import { PrimaryCTAFooter, DualActionFooter } from "@/Routes/shell/footers"
import { Stepper } from "@/components/Stepper"
import {
  useJourneyStepper,
  useJourneyStepMeta,
} from "@/Routes/shell/useJourneyStepper"
import { cn } from "@/lib/utils"

/** Declarative single primary action → renders a PrimaryCTAFooter in the slot. */
export type PrimaryCta = {
  label: React.ReactNode
  onClick?: () => void
  type?: "submit" | "button" | "reset"
  form?: string
  disabled?: boolean
  isLoading?: boolean
}

/** Declarative primary + secondary actions → renders a DualActionFooter. */
export type DualCta = {
  primary: PrimaryCta
  secondary: {
    label: React.ReactNode
    onClick?: () => void
    type?: "submit" | "button" | "reset"
    form?: string
    disabled?: boolean
  }
}

/**
 * Resolve the footer node from the (mutually exclusive) footer inputs. An
 * explicit `footer` node always wins (escape hatch for bespoke bars); otherwise
 * `dualCta` → DualActionFooter, `primaryCta` → PrimaryCTAFooter.
 */
function resolveFooter(
  footer: React.ReactNode | undefined,
  primaryCta: PrimaryCta | undefined,
  dualCta: DualCta | undefined
): React.ReactNode | undefined {
  if (footer) return footer
  if (dualCta)
    return (
      <DualActionFooter
        primary={dualCta.primary}
        secondary={dualCta.secondary}
      />
    )
  if (primaryCta) return <PrimaryCTAFooter {...primaryCta} />
  return undefined
}

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
  primaryCta,
  dualCta,
  bodyPadding = "default",
  variant = "legacy",
  pageTitle,
  description,
  headerAction,
  headerIcon,
  headerAlign = "center",
  showStepper = true,
  barTitle,
}: {
  /**
   * Page body. Optional for content-variant screens whose entire payload is the
   * PageHeader (icon + title + description) and a pinned footer — e.g. the
   * success screens, which have no scrolling body content.
   */
  children?: React.ReactNode
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
   * Declarative single primary CTA. Renders a `PrimaryCTAFooter` into the footer
   * slot — prefer this over hand-passing `footer`. Ignored if `footer` is set.
   */
  primaryCta?: PrimaryCta
  /**
   * Declarative primary + secondary CTAs. Renders a `DualActionFooter`. Ignored
   * if `footer` is set; takes precedence over `primaryCta`.
   */
  dualCta?: DualCta
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
  /**
   * Short title for the app bar itself (variant="content"). The content bar is
   * bordered/sticky canonical chrome like every other screen, so it carries a
   * terse page/step name here — distinct from the descriptive in-body
   * `pageTitle` hero. Falls back to the current journey step's terse label
   * (`useJourneyStepMeta`) when omitted; pass explicit copy for non-journey
   * screens. Legacy variant uses `title` for its bar as before.
   */
  barTitle?: string
}) {
  const resolvedFooter = resolveFooter(footer, primaryCta, dualCta)

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
        footer={resolvedFooter}
        bodyPadding={bodyPadding}
        pageTitle={pageTitle}
        description={description}
        headerAction={headerAction}
        headerIcon={headerIcon}
        headerAlign={headerAlign}
        showStepper={showStepper}
        barTitle={barTitle}
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
      footer={resolvedFooter}
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
  barTitle,
}: {
  children?: React.ReactNode
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
  barTitle?: string
}) {
  const stepper = useJourneyStepper()
  const meta = useJourneyStepMeta()

  const resolvedTitle = pageTitle ?? title ?? meta.title
  const resolvedDescription = description ?? meta.description
  // The app bar carries a terse title (explicit barTitle, else the journey
  // step's short label). The bar is bordered canonical chrome like every other
  // screen; the descriptive `resolvedTitle` stays as the in-body PageHeader
  // hero, so the two never collide. The in-bar stepper stays off — progress is
  // shown in the PageHeader for the content layout.
  const resolvedBarTitle = barTitle ?? meta.title

  return (
    <AppShell
      header={
        <StepperHeader
          title={resolvedBarTitle}
          isRoot={isRoot}
          showHelp={showHelp}
          onBack={onBack}
          backIcon={backIcon}
          rightAction={rightAction}
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
