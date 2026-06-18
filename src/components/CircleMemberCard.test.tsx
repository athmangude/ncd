import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  CircleMemberCard,
  variantFromStatus,
} from "./CircleMemberCard"

const NOW = new Date("2026-05-20T12:00:00Z")

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

describe("variantFromStatus", () => {
  it.each([
    // Backend hardcodes 'ACTIVE' for filled patient slots and 'DEPENDENT'
    // for dependents; the invite list uses InvitationStatus (ACCEPTED etc.)
    ["ACTIVE", daysAgo(30), false, "active"],
    ["ACTIVE", daysAgo(3), false, "new"],
    ["ACTIVE", daysAgo(6.99), false, "new"],
    ["ACTIVE", daysAgo(7.01), false, "active"],
    ["ACTIVE", null, false, "active"],
    ["ACTIVE", daysAgo(3), true, "defaulted"],
    ["DEPENDENT", daysAgo(3), false, "new"],
    ["ACCEPTED", daysAgo(3), false, "new"],
    ["PENDING", null, false, "pending"],
    ["OPENED", null, false, "pending"],
    ["PENDING", null, true, "defaulted"],
    ["REJECTED", null, false, "inactive"],
    ["STALLED", null, false, "inactive"],
    ["CANCELLED", null, false, "inactive"],
    ["INACTIVE", null, false, "inactive"],
    ["REVOKED", null, false, "inactive"],
    ["UNKNOWN", null, false, "active"],
  ] as const)(
    "status=%s joinedAt=%s defaulted=%s → %s",
    (status, joinedAt, hasDefaultedLoan, expected) => {
      expect(
        variantFromStatus(status, { joinedAt, hasDefaultedLoan }),
      ).toBe(expected)
    },
  )
})

describe("CircleMemberCard rendering", () => {
  const baseProps = {
    firstName: "Jane",
    lastName: "Doe",
    phoneNumber: "+254700000000",
  }

  it("active: lavender halo, no dot, no label pill", () => {
    const { container } = render(
      <CircleMemberCard {...baseProps} variant="active" />,
    )
    const halo = container.querySelector('[data-testid="avatar-halo"]')!
    expect(halo.className).toContain("bg-purple-300")
    expect(container.querySelector('[data-testid="avatar-dot"]')).toBeNull()
    expect(container.querySelector('[data-testid="avatar-badge"]')).toBeNull()
  })

  it("new: green halo, green dot, 'New!' pill", () => {
    const { container } = render(
      <CircleMemberCard {...baseProps} variant="new" />,
    )
    const halo = container.querySelector('[data-testid="avatar-halo"]')!
    expect(halo.className).toContain("bg-green-300")
    const dot = container.querySelector('[data-testid="avatar-dot"]')!
    expect(dot.className).toContain("bg-green-500")
    expect(screen.getByText("New!")).toBeInTheDocument()
    expect(screen.getByText("New!").className).toContain("bg-green-100")
  })

  it("pending: orange halo, orange dot, 'Waiting...' pill", () => {
    const { container } = render(
      <CircleMemberCard {...baseProps} variant="pending" />,
    )
    const halo = container.querySelector('[data-testid="avatar-halo"]')!
    expect(halo.className).toContain("bg-orange-300")
    const dot = container.querySelector('[data-testid="avatar-dot"]')!
    expect(dot.className).toContain("bg-orange-500")
    expect(screen.getByText("Waiting...")).toBeInTheDocument()
    expect(screen.getByText("Waiting...").className).toContain("bg-orange-100")
  })

  it("defaulted: red halo, red dot, 'Default' pill", () => {
    const { container } = render(
      <CircleMemberCard {...baseProps} variant="defaulted" />,
    )
    const halo = container.querySelector('[data-testid="avatar-halo"]')!
    expect(halo.className).toContain("bg-red-300")
    const dot = container.querySelector('[data-testid="avatar-dot"]')!
    expect(dot.className).toContain("bg-red-500")
    expect(screen.getByText("Default")).toBeInTheDocument()
    expect(screen.getByText("Default").className).toContain("bg-red-100")
  })

  it("inactive: gray halo, lock icon, no dot, no pill", () => {
    const { container } = render(
      <CircleMemberCard {...baseProps} variant="inactive" />,
    )
    const halo = container.querySelector('[data-testid="avatar-halo"]')!
    expect(halo.className).toContain("bg-neutral-300")
    expect(container.querySelector('[data-testid="lock-icon"]'))
      .not.toBeNull()
    expect(container.querySelector('[data-testid="avatar-dot"]')).toBeNull()
    expect(container.querySelector('[data-testid="avatar-badge"]')).toBeNull()
  })

  it("renders both layouts without error", () => {
    render(
      <CircleMemberCard {...baseProps} variant="new" layout="card" />,
    )
    render(
      <CircleMemberCard {...baseProps} variant="new" layout="list" />,
    )
    expect(screen.getAllByText("New!")).toHaveLength(2)
  })
})
