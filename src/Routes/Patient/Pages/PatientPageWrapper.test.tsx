import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import PatientPageWrapper from "./PatientPageWrapper"

// Stub the route-driven header so this suite focuses on how PatientPageWrapper
// composes the AppShell (header/footer/body). StepperHeader has its own tests.
// `border` is surfaced so the content-variant tests can assert the bar is now
// canonical (bordered) rather than the old borderless "form header".
vi.mock("@/Routes/shell/StepperHeader", () => ({
  default: ({ title, border }: { title?: string; border?: boolean }) => (
    <div data-testid="stepper-header" data-border={String(border !== false)}>
      {title}
    </div>
  ),
}))

// The content variant reads the current journey step; stub the hooks so the
// suite doesn't need a Router. meta.title backs the bar-title fallback.
vi.mock("@/Routes/shell/useJourneyStepper", () => ({
  useJourneyStepper: () => null,
  useJourneyStepMeta: () => ({ title: "Step Label" }),
}))

describe("PatientPageWrapper", () => {
  it("renders its children inside the shell body", () => {
    render(
      <PatientPageWrapper title="My title">
        <p>body content</p>
      </PatientPageWrapper>
    )
    expect(screen.getByText("body content")).toBeInTheDocument()
    expect(screen.getByRole("main")).toContainElement(
      screen.getByText("body content")
    )
  })

  it("passes the title through to the header slot", () => {
    render(<PatientPageWrapper title="My title">x</PatientPageWrapper>)
    expect(screen.getByTestId("stepper-header")).toHaveTextContent("My title")
  })

  it("supplies the default p-4 body padding via the shell", () => {
    render(<PatientPageWrapper>x</PatientPageWrapper>)
    expect(screen.getByRole("main").className).toContain("p-4")
  })

  it("renders no footer by default and gives the body the bottom safe-area inset", () => {
    render(<PatientPageWrapper>x</PatientPageWrapper>)
    expect(screen.queryByText("the-footer")).not.toBeInTheDocument()
    expect(screen.getByRole("main").className).toContain("safe-pb")
  })

  it("renders a pinned footer when one is provided", () => {
    render(
      <PatientPageWrapper footer={<div>the-footer</div>}>x</PatientPageWrapper>
    )
    expect(screen.getByText("the-footer")).toBeInTheDocument()
    // With a footer present, the inset moves off the body and onto the footer.
    expect(screen.getByRole("main").className).not.toContain("safe-pb")
  })

  it("merges className onto the content section", () => {
    render(
      <PatientPageWrapper className="custom-class">
        <p>body</p>
      </PatientPageWrapper>
    )
    const section = screen.getByText("body").closest("section")
    expect(section?.className).toContain("custom-class")
    expect(section?.className).toContain("gap-5")
  })

  it('drops the shell p-4 when bodyPadding is "none" (full-bleed screens)', () => {
    render(<PatientPageWrapper bodyPadding="none">x</PatientPageWrapper>)
    expect(screen.getByRole("main").className).not.toContain("p-4")
  })

  it("renders a PrimaryCTAFooter from the primaryCta prop", () => {
    const onClick = vi.fn()
    render(
      <PatientPageWrapper primaryCta={{ label: "Continue", onClick }}>
        x
      </PatientPageWrapper>
    )
    const btn = screen.getByRole("button", { name: "Continue" })
    expect(btn).toBeInTheDocument()
    // CTA lives in the pinned footer, so the body loses its safe-pb inset.
    expect(screen.getByRole("main").className).not.toContain("safe-pb")
  })

  it("forwards form/type on primaryCta so a footer CTA can submit a body form", () => {
    render(
      <PatientPageWrapper
        primaryCta={{ label: "Submit", type: "submit", form: "my-form" }}
      >
        x
      </PatientPageWrapper>
    )
    const btn = screen.getByRole("button", { name: "Submit" })
    expect(btn).toHaveAttribute("type", "submit")
    expect(btn).toHaveAttribute("form", "my-form")
  })

  it("renders a DualActionFooter (secondary + primary) from the dualCta prop", () => {
    render(
      <PatientPageWrapper
        dualCta={{
          primary: { label: "Pay", onClick: vi.fn() },
          secondary: { label: "Back", onClick: vi.fn() },
        }}
      >
        x
      </PatientPageWrapper>
    )
    expect(screen.getByRole("button", { name: "Pay" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
  })

  it("lets an explicit footer node win over primaryCta/dualCta", () => {
    render(
      <PatientPageWrapper
        footer={<div>the-footer</div>}
        primaryCta={{ label: "Continue" }}
      >
        x
      </PatientPageWrapper>
    )
    expect(screen.getByText("the-footer")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Continue" })
    ).not.toBeInTheDocument()
  })

  describe('variant="content"', () => {
    it("gives the content app bar the canonical bottom border (not borderless)", () => {
      render(
        <PatientPageWrapper variant="content" pageTitle="Hero title">
          x
        </PatientPageWrapper>
      )
      // The bar must be bordered like every other screen — the old content
      // layout passed border={false}, which this asserts against.
      expect(screen.getByTestId("stepper-header")).toHaveAttribute(
        "data-border",
        "true"
      )
    })

    it("puts an explicit barTitle in the app bar, not the hero pageTitle", () => {
      render(
        <PatientPageWrapper
          variant="content"
          barTitle="Pay a bill"
          pageTitle="Pay to over 14,000 licensed health facilities"
        >
          x
        </PatientPageWrapper>
      )
      // Bar shows the terse barTitle; the descriptive pageTitle stays in the
      // in-body PageHeader hero (rendered separately, not in the bar stub).
      expect(screen.getByTestId("stepper-header")).toHaveTextContent(
        "Pay a bill"
      )
    })

    it("falls back to the journey step label when no barTitle is given", () => {
      render(
        <PatientPageWrapper variant="content" pageTitle="Hero">
          x
        </PatientPageWrapper>
      )
      expect(screen.getByTestId("stepper-header")).toHaveTextContent(
        "Step Label"
      )
    })
  })
})
