import { describe, it, expect } from "vitest"
import { useDashboardFirstLoad } from "./useDashboardFirstLoad"

describe("useDashboardFirstLoad", () => {
  it("shows the skeleton and plays the intro when loading with no data yet", () => {
    expect(useDashboardFirstLoad(true, false)).toEqual({
      showSkeleton: true,
      mode: "intro",
    })
  })

  it("skips the skeleton but replays the intro when refetching WITH cached data", () => {
    expect(useDashboardFirstLoad(true, true)).toEqual({
      showSkeleton: false,
      mode: "intro",
    })
  })

  it("plays the snappy switch reveal when not loading (cached/fresh)", () => {
    expect(useDashboardFirstLoad(false, true)).toEqual({
      showSkeleton: false,
      mode: "switch",
    })
  })

  it("plays the snappy switch reveal when not loading and no data (e.g. empty state)", () => {
    expect(useDashboardFirstLoad(false, false)).toEqual({
      showSkeleton: false,
      mode: "switch",
    })
  })
})
