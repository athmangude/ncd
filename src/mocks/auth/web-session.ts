/** Stub for `supertokens-web-js/recipe/session`. */
import {
  endMockSession,
  getMockUserId,
  mockSessionExists,
  MOCK_TENANT_ID,
} from "./session"

const Session = {
  doesSessionExist: async () => mockSessionExists(),
  getUserId: async () => getMockUserId(),
  getAccessTokenPayloadSecurely: async () => ({ tId: MOCK_TENANT_ID }),
  signOut: async () => {
    endMockSession()
  },
  attemptRefreshingSession: async () => true,
  // No-op in the prototype; kept for API compatibility with call sites.
  addAxiosInterceptors: (_axiosInstance: unknown) => {},
}

export default Session
