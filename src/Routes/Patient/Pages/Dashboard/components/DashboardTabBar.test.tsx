import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { useMotionValue, useTransform } from "framer-motion"
import { Tabs } from "@radix-ui/react-tabs"
import { DashboardTabBar } from "./DashboardTabBar"
import { useRef } from "react"

/**
 * Wrapper that provides the Radix Tabs context and framer-motion values
 * required by DashboardTabBar. The `defaultValue` determines which tab
 * appears active.
 */
function TabBarHarness({ defaultValue = "home" }: { defaultValue?: string }) {
  const listRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const cx = useMotionValue(0)
  const pathD = useTransform(cx, () => "M 0 0 Z")

  return (
    <Tabs defaultValue={defaultValue}>
      <DashboardTabBar
        listRef={listRef}
        tabRefs={tabRefs}
        cx={cx}
        pathD={pathD}
      />
    </Tabs>
  )
}

describe("DashboardTabBar", () => {
  it("renders all five navigation tabs in the correct order", () => {
    render(<TabBarHarness />)

    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(5)

    const tabNames = tabs.map((tab) => tab.textContent?.trim().toLowerCase())
    expect(tabNames).toEqual(["home", "circle", "care", "explore", "profile"])
  })

  it("renders the care tab with the correct label text", () => {
    render(<TabBarHarness />)
    expect(screen.getByRole("tab", { name: /care/i })).toBeInTheDocument()
  })

  it("places the care tab between circle and explore", () => {
    render(<TabBarHarness />)
    const tabs = screen.getAllByRole("tab")
    const names = tabs.map((t) => t.textContent?.trim().toLowerCase())
    const circleIndex = names.indexOf("circle")
    const careIndex = names.indexOf("care")
    const exploreIndex = names.indexOf("explore")

    expect(careIndex).toBe(circleIndex + 1)
    expect(exploreIndex).toBe(careIndex + 1)
  })

  it("marks the home tab as active by default", () => {
    render(<TabBarHarness defaultValue="home" />)
    expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute(
      "data-state",
      "active"
    )
    expect(screen.getByRole("tab", { name: /care/i })).toHaveAttribute(
      "data-state",
      "inactive"
    )
  })

  it("marks the care tab as active when defaultValue is care", () => {
    render(<TabBarHarness defaultValue="care" />)
    expect(screen.getByRole("tab", { name: /care/i })).toHaveAttribute(
      "data-state",
      "active"
    )
    expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute(
      "data-state",
      "inactive"
    )
  })

  it("renders the tablist landmark for accessibility", () => {
    render(<TabBarHarness />)
    expect(screen.getByRole("tablist")).toBeInTheDocument()
  })
})
