/** Stub for `supertokens-auth-react/recipe/passwordless` (phone OTP). */
import {
  getMockUserId,
  hasMockAccount,
  markMockAccountCreated,
  startMockSession,
} from "./session"
import { seedEmptyProfile } from "../domain/seed"

interface CreateCodeResult {
  status: string
  deviceId: string
  preAuthSessionId: string
  flowType: string
  reason?: string
}

interface ConsumeCodeResult {
  status: string
  createdNewRecipeUser: boolean
  user: { id: string; loginMethods: { recipeId: string }[] }
  maximumCodeInputAttempts: number
  failedCodeInputAttemptCount: number
}

export async function createCode(_input?: unknown): Promise<CreateCodeResult> {
  return {
    status: "OK",
    deviceId: "mock-device",
    preAuthSessionId: "mock-pre-auth",
    flowType: "USER_INPUT_CODE",
  }
}

export async function resendCode(
  _input?: unknown
): Promise<{ status: string }> {
  return { status: "OK" }
}

export async function clearLoginAttemptInfo(): Promise<void> {
  // nothing to clear in the prototype
}

/**
 * Accepts any 6-digit code. First-ever sign-in is treated as a new user (so the
 * onboarding journey runs); subsequent sign-ins are treated as returning.
 */
export async function consumeCode(_input?: {
  userInputCode?: string
}): Promise<ConsumeCodeResult> {
  const isReturning = hasMockAccount()
  const userId = getMockUserId()
  startMockSession(userId)
  if (!isReturning) {
    markMockAccountCreated()
    // Brand-new participant: give them a blank profile so the onboarding journey
    // runs, rather than reading the rich "Amina" fixture as a fully-onboarded user.
    seedEmptyProfile()
  }

  return {
    status: "OK",
    createdNewRecipeUser: !isReturning,
    user: {
      id: userId,
      loginMethods: [{ recipeId: "passwordless" }],
    },
    maximumCodeInputAttempts: 5,
    failedCodeInputAttemptCount: 0,
  }
}

const Passwordless = { init: (_config?: unknown) => ({}) }
export default Passwordless
