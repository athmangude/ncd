import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import PatientAuthWrapper from "./PatientAuthWrapper"

describe("PatientAuthWrapper (AppShell composition)", () => {
  it("renders its children inside the shell body", () => {
    render(
      <PatientAuthWrapper>
        <p>body content</p>
      </PatientAuthWrapper>
    )
    expect(screen.getByRole("main")).toContainElement(
      screen.getByText("body content")
    )
  })

  it("renders the Jireh logo in the header slot", () => {
    render(<PatientAuthWrapper>x</PatientAuthWrapper>)
    expect(screen.getByAltText("Jireh Logo")).toBeInTheDocument()
  })

  it("renders no footer by default and gives the body the bottom safe-area inset", () => {
    render(<PatientAuthWrapper>x</PatientAuthWrapper>)
    expect(screen.queryByText("the-footer")).not.toBeInTheDocument()
    expect(screen.getByRole("main").className).toContain("safe-pb")
  })

  it("renders a pinned footer when provided and moves the inset off the body", () => {
    render(
      <PatientAuthWrapper footer={<div>the-footer</div>}>x</PatientAuthWrapper>
    )
    expect(screen.getByText("the-footer")).toBeInTheDocument()
    expect(screen.getByRole("main").className).not.toContain("safe-pb")
  })

  it("merges className onto the content section", () => {
    render(
      <PatientAuthWrapper className="custom-class">
        <p>body</p>
      </PatientAuthWrapper>
    )
    const section = screen.getByText("body").closest("section")
    expect(section?.className).toContain("custom-class")
    expect(section?.className).toContain("gap-7")
  })
})
