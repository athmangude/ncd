import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { CircleNetworkViz } from "./CircleNetworkViz"
import type { NetworkMember, SentInvite } from "@/hooks/usePatientNetwork"

// ── Helpers ──────────────────────────────────────────────────────────────────

function adult(overrides: Partial<NetworkMember> = {}): NetworkMember {
  return {
    id: "a1",
    firstName: "Ada",
    lastName: "Lovelace",
    profilePhoto: null,
    joinedAt: "2020-01-01T00:00:00.000Z", // old → "active", not "new"
    ...overrides,
  } as NetworkMember
}

function invite(overrides: Partial<SentInvite> = {}): SentInvite {
  return {
    id: "i1",
    firstName: "Grace",
    lastName: "Hopper",
    profilePhoto: null,
    ...overrides,
  } as SentInvite
}

function renderViz(props: Partial<Parameters<typeof CircleNetworkViz>[0]> = {}) {
  return render(
    <CircleNetworkViz
      currentUserFirstName="Test"
      currentUserLastName="User"
      currentUserPhoto={null}
      adults={[]}
      childMembers={[]}
      invites={[]}
      isLoading={false}
      onAddMember={() => {}}
      {...props}
    />
  )
}

// Adult connecting lines are keyed `al-<index>`; first 4 in document order.
function adultLines(container: HTMLElement) {
  return Array.from(container.querySelectorAll("line")).filter((l) =>
    l.getAttribute("x2") !== null
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CircleNetworkViz connecting lines", () => {
  it("draws a solid purple line for a confirmed (active) member", () => {
    const { container } = renderViz({ adults: [adult()] })
    const line = container.querySelectorAll("line")[0]
    expect(line.getAttribute("stroke")).toBe("currentColor")
    expect(line).toHaveClass("text-purple-300")
    expect(line.getAttribute("stroke-dasharray")).toBeNull()
  })

  it("draws a solid green line for a recently joined (new) member", () => {
    const { container } = renderViz({
      adults: [adult({ joinedAt: new Date().toISOString() })],
    })
    const line = container.querySelectorAll("line")[0]
    expect(line).toHaveClass("text-green-300")
    expect(line.getAttribute("stroke-dasharray")).toBeNull()
  })

  it("keeps a dashed line for a pending invite", () => {
    const { container } = renderViz({ invites: [invite()] })
    const line = container.querySelectorAll("line")[0]
    expect(line).toHaveClass("text-orange-300")
    expect(line.getAttribute("stroke-dasharray")).toBe("4 4")
  })

  it("keeps a dashed line for empty slots", () => {
    const { container } = renderViz()
    // No adults/invites → all 4 adult lines are empty slots.
    const lines = container.querySelectorAll("line")
    Array.from(lines).forEach((line) => {
      expect(line.getAttribute("stroke-dasharray")).toBe("4 4")
    })
  })

  it("draws solid lines for confirmed child members", () => {
    const child = {
      id: "c1",
      firstName: "Kid",
      lastName: "One",
      profilePhoto: null,
    } as NetworkMember
    const { container } = renderViz({ childMembers: [child] })
    const childLine = adultLines(container).find((l) =>
      l.getAttribute("class")?.includes("text-neutral-200")
    )
    expect(childLine).toBeDefined()
    expect(childLine?.getAttribute("stroke-dasharray")).toBeNull()
  })
})
