import { describe, it, expect } from "vitest"
import {
  CIRCLE_INVITE_SMS_STEPS,
  CIRCLE_INVITE_VOICE_STEPS,
} from "./useNextCircleInviteStep"

describe("CIRCLE_INVITE_SMS_STEPS", () => {
  it("has exactly 4 steps", () => {
    expect(CIRCLE_INVITE_SMS_STEPS).toHaveLength(4)
  })

  it("starts at add-circle-member", () => {
    expect(CIRCLE_INVITE_SMS_STEPS[0]).toBe(
      "/patients/network/add-circle-member"
    )
  })

  it("has invite-text at step 2", () => {
    expect(CIRCLE_INVITE_SMS_STEPS[1]).toBe("/patients/network/invite-text")
  })

  it("ends at preview-invite", () => {
    expect(CIRCLE_INVITE_SMS_STEPS[3]).toBe("/patients/network/preview-invite")
  })
})

describe("CIRCLE_INVITE_VOICE_STEPS", () => {
  it("has exactly 4 steps", () => {
    expect(CIRCLE_INVITE_VOICE_STEPS).toHaveLength(4)
  })

  it("has invite-voice at step 2", () => {
    expect(CIRCLE_INVITE_VOICE_STEPS[1]).toBe("/patients/network/invite-voice")
  })

  it("shares step 1, 3, 4 with SMS flow", () => {
    expect(CIRCLE_INVITE_VOICE_STEPS[0]).toBe(CIRCLE_INVITE_SMS_STEPS[0])
    expect(CIRCLE_INVITE_VOICE_STEPS[2]).toBe(CIRCLE_INVITE_SMS_STEPS[2])
    expect(CIRCLE_INVITE_VOICE_STEPS[3]).toBe(CIRCLE_INVITE_SMS_STEPS[3])
  })
})
