import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Badge } from "./Badge"

describe("Badge", () => {
  it("defaults to the default variant", () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText("Default").className).toContain("bg-primary")
  })

  it.each(["success", "warning", "info"] as const)(
    "supports the new %s status variant",
    (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>)
      const el = screen.getByText(variant)
      expect(el.className).toContain(`bg-${variant}`)
      expect(el.className).toContain(`text-${variant}-foreground`)
    }
  )

  it("supports the neutral status variant", () => {
    render(<Badge variant="neutral">Neutral</Badge>)
    const el = screen.getByText("Neutral")
    expect(el.className).toContain("bg-muted")
    expect(el.className).toContain("text-muted-foreground")
  })
})
