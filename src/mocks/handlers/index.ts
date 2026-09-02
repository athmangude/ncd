import { http, passthrough, type RequestHandler } from "msw"
import { profileHandlers } from "./profile"
import { discoveryHandlers } from "./discovery"
import { loansHandlers } from "./loans"
import { onboardingHandlers } from "./onboarding"
import { networkHandlers } from "./network"
import { careFundHandlers } from "./carefund"
import { fastTrackHandlers } from "./fasttrack"
import { notificationsHandlers } from "./notifications"
import { miscHandlers } from "./misc"
import { careCompanionHandlers } from "./carecompanion"

/**
 * MSW request handlers for the standalone prototype. Each feature contributes
 * its own handler module; they are aggregated here. Handlers read editable JSON
 * fixtures (src/mocks/fixtures) and persist user-created records to localStorage
 * via src/mocks/db.ts.
 */
export const handlers: RequestHandler[] = [
  http.post("/api/gemini/*", () => passthrough()),
  http.all("https://qippjxnvfuedcaourdav.supabase.co/*", () => passthrough()),
  ...profileHandlers,
  ...discoveryHandlers,
  ...loansHandlers,
  ...onboardingHandlers,
  ...networkHandlers,
  ...careFundHandlers,
  ...fastTrackHandlers,
  ...notificationsHandlers,
  ...miscHandlers,
  ...careCompanionHandlers,
]
