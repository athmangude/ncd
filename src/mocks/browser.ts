import { setupWorker } from "msw/browser"
import { handlers } from "./handlers"
import { migrateSeedVersion } from "./db"
import { hasMockAccount } from "./auth/session"
import { seedFreshAccount } from "./domain/seed"

export const worker = setupWorker(...handlers)

/**
 * Registers the Mock Service Worker. All API requests are same-origin paths
 * (the API base URL is "" — see vite.config) so the worker can intercept them.
 * The worker script lives at <base>/mockServiceWorker.js.
 */
export async function startMockServiceWorker(): Promise<void> {
  // Drop stale localStorage state when fixture shapes change so existing
  // sessions pick up new fields (wallets, patientCircle, loans, …).
  migrateSeedVersion()

  // Default to a fresh, empty, logged-in participant who builds their own
  // profile through onboarding. A returning participant (account flag set) keeps
  // whatever they have already built; only a brand-new / just-migrated browser
  // is seeded fresh.
  if (!hasMockAccount()) {
    seedFreshAccount()
  }

  await worker.start({
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
    // Let static assets pass through silently, but loudly warn for any
    // same-origin API-style call that has no handler (would otherwise surface
    // as a confusing 404). Helps spot a missing mock during testing.
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      const isAsset =
        url.pathname.startsWith(`${import.meta.env.BASE_URL}assets/`) ||
        url.pathname.startsWith("/assets/") ||
        /\.[a-z0-9]+$/i.test(url.pathname)
      if (url.origin === window.location.origin && !isAsset) {
        print.warning()
      }
    },
  })
}
