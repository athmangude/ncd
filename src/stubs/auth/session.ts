const SESSION_FLAG = "mock_session_exists"
const USER_ID_KEY = "mock_user_id"
const ACCOUNT_FLAG = "mock_has_account"

export const DEFAULT_MOCK_USER_ID = "patient-001"
export const MOCK_TENANT_ID = "patients"

export function getMockUserId(): string {
  return localStorage.getItem(USER_ID_KEY) || DEFAULT_MOCK_USER_ID
}

export function startMockSession(userId: string = DEFAULT_MOCK_USER_ID): void {
  localStorage.setItem(SESSION_FLAG, "true")
  localStorage.setItem(USER_ID_KEY, userId)
}

export function endMockSession(): void {
  localStorage.removeItem(SESSION_FLAG)
}

export function mockSessionExists(): boolean {
  return localStorage.getItem(SESSION_FLAG) === "true"
}

export function hasMockAccount(): boolean {
  return localStorage.getItem(ACCOUNT_FLAG) === "true"
}

export function markMockAccountCreated(): void {
  localStorage.setItem(ACCOUNT_FLAG, "true")
}
