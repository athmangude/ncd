import { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { getMockUserId, mockSessionExists, MOCK_TENANT_ID } from "./session"

interface SessionAuthProps {
  children?: ReactNode
  requireAuth?: boolean
}

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
