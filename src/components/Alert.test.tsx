import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Alert, AlertTitle, AlertDescription } from "./Alert"

describe("Alert", () => {
  it("renders with role=alert and the default variant", () => {
    render(<Alert>Heads up</Alert>)
    const el = screen.getByRole("alert")
    expect(el.className).toContain("bg-background")
  })

  it("renders title and description content", () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
  })

  it("keeps the existing destructive variant", () => {
    render(<Alert variant="destructive">Danger</Alert>)
    expect(screen.getByRole("alert").className).toContain("text-destructive")
  })

  it.each(["info", "success", "warning"] as const)(
    "supports the %s status variant",
    (variant) => {
      render(<Alert variant={variant}>{variant}</Alert>)
      const el = screen.getByRole("alert")
      expect(el.className).toContain(`bg-${variant}`)
      expect(el.className).toContain(`text-${variant}-foreground`)
    }
  )
})
