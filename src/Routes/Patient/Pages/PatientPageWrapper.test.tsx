import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import PatientPageWrapper from "./PatientPageWrapper"

// Stub the route-driven header so this suite focuses on how PatientPageWrapper
// composes the AppShell (header/footer/body). StepperHeader has its own tests.
vi.mock("@/Routes/shell/StepperHeader", () => ({
  default: ({ title }: { title?: string }) => (
    <div data-testid="stepper-header">{title}</div>
  ),
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
})
