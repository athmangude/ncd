// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PageHeader } from "./PageHeader"

describe("PageHeader", () => {
  it("renders the title as an h1", () => {
    render(<PageHeader title="Your details" />)
    const heading = screen.getByRole("heading", { name: "Your details" })
    expect(heading.tagName).toBe("H1")
  })

  it("renders without a description without crashing", () => {
    render(<PageHeader title="Your details" />)
    expect(screen.getByText("Your details")).toBeInTheDocument()
  })

  it("renders the description and action when provided", () => {
    render(
      <PageHeader
        title="My Jireh Circle"
        description="Add people you trust."
        action={<button type="button">What is a Circle?</button>}
      />
    )
    expect(screen.getByText("Add people you trust.")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "What is a Circle?" })
    ).toBeInTheDocument()
  })

  it("renders a leading icon above the title in DOM order", () => {
    render(
      <PageHeader
        title="Upload a photo"
        icon={<img data-testid="icon" alt="" />}
      />
    )
    const icon = screen.getByTestId("icon")
    const heading = screen.getByRole("heading", { name: "Upload a photo" })
    expect(
      icon.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("renders the stepper above the title in DOM order", () => {
    render(
      <PageHeader
        title="Submit your ID"
        stepper={<div data-testid="stepper" />}
      />
    )
    const stepper = screen.getByTestId("stepper")
    const heading = screen.getByRole("heading", { name: "Submit your ID" })
    // Node.DOCUMENT_POSITION_FOLLOWING (4) => heading comes after the stepper.
    expect(
      stepper.compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("is not sticky and has no bottom border (it lives in content)", () => {
    const { container } = render(<PageHeader title="Your details" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).not.toContain("sticky")
    expect(root.className).not.toContain("border-b")
  })

  it("centers by default and left-aligns when align='start'", () => {
    const { container, rerender } = render(<PageHeader title="X" />)
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "items-center"
    )
    rerender(<PageHeader title="X" align="start" />)
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "items-start"
    )
  })
})
