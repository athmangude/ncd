// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { acceptInvite, getNetwork } from "./network"

beforeEach(() => {
  localStorage.clear()
})

describe("network domain", () => {
  it("acceptInvite moves a pending invite into the active circle", () => {
    const before = getNetwork()
    const invite = before.invites[0]
    expect(invite).toBeTruthy()

    const after = acceptInvite(invite.id)

    expect(after.invites.find((item) => item.id === invite.id)).toBeUndefined()
    const member = after.network.find((item) => item.id === invite.id)
    expect(member).toBeTruthy()
    expect(member?.status).toBe("ACTIVE")
  })

  it("is a no-op for an unknown invite id", () => {
    const before = getNetwork()
    const after = acceptInvite("does-not-exist")
    expect(after.network.length).toBe(before.network.length)
    expect(after.invites.length).toBe(before.invites.length)
  })
})
