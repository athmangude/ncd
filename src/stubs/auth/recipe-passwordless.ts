import {
  getMockUserId,
  hasMockAccount,
  markMockAccountCreated,
  startMockSession,
} from "./session"
import { supabase } from "@/lib/supabase"

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
  _input?: unknown,
): Promise<{ status: string }> {
  return { status: "OK" }
}

export async function clearLoginAttemptInfo(): Promise<void> {}

export async function consumeCode(_input?: {
  userInputCode?: string
}): Promise<ConsumeCodeResult> {
  const isReturning = hasMockAccount()
  const userId = getMockUserId()
  startMockSession(userId)
  if (!isReturning) {
    markMockAccountCreated()
    await supabase.rpc("rpc_reset_to_onboarding")
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
