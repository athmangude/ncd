import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { DashboardSkeleton } from "./DashboardSkeleton"

describe("DashboardSkeleton", () => {
  it("renders the given number of section blocks", () => {
    const { container } = render(<DashboardSkeleton sections={4} />)
    // Root's children: 1 header block + 4 section blocks.
    const root = container.firstElementChild!
    expect(root.children.length).toBe(5)
  })

  it("omits the header block when showHeader is false", () => {
    const { container } = render(
      <DashboardSkeleton sections={2} showHeader={false} />
    )
    const root = container.firstElementChild!
    expect(root.children.length).toBe(2)
  })

  it("defaults to 3 sections", () => {
    const { container } = render(<DashboardSkeleton showHeader={false} />)
    const root = container.firstElementChild!
    expect(root.children.length).toBe(3)
  })
})
