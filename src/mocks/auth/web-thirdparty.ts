/** Stub for `supertokens-web-js/recipe/thirdparty` (social login). */
import { getMockUserId, startMockSession } from "./session"

export async function getAuthorisationURLWithQueryParamsAndSetState(
  _input?: unknown
): Promise<string> {
  // No external OAuth in the prototype; return an in-app hash route.
  return "#/patients/"
}

export async function signInAndUp(_input?: unknown): Promise<{
  status: string
  user: { id: string }
  createdNewRecipeUser: boolean
  reason?: string
}> {
  const userId = getMockUserId()
  startMockSession(userId)
  return {
    status: "OK",
    user: { id: userId },
    createdNewRecipeUser: false,
  }
}
