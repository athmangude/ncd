/** Stub for `supertokens-auth-react/recipe/session` (React bindings). */
import { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { getMockUserId, mockSessionExists, MOCK_TENANT_ID } from "./session"

interface SessionAuthProps {
  children?: ReactNode
  requireAuth?: boolean
}

/**
 * When auth is required and there is no mock session, send the user to the
 * patient auth screen — otherwise render children. Mirrors the real component's
 * gate closely enough for the prototype.
 */
export function SessionAuth({
  children,
  requireAuth = true,
}: SessionAuthProps) {
  if (requireAuth && !mockSessionExists()) {
    return <Navigate to="/patients/auth" replace />
  }
  return <>{children}</>
}

export function useSessionContext() {
  return {
    loading: false as const,
    doesSessionExist: mockSessionExists(),
    userId: getMockUserId(),
    accessTokenPayload: { tId: MOCK_TENANT_ID } as Record<string, unknown>,
    invalidClaims: [] as unknown[],
  }
}

const Session = { init: (_config?: unknown) => ({}) }
export default Session
