import { setupWorker } from "msw/browser"
import { handlers } from "./handlers"
import { migrateSeedVersion } from "./db"

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

  // No auto-login. A brand-new (or signed-out) browser starts logged-out at the
  // splash / phone-number entry; the OTP flow creates the account and seeds an
  // empty profile (see consumeCode). A returning participant keeps whatever they
  // already built — reloading never restarts them. Only "Sign out" wipes back to
  // the fresh, unseeded phone-input state.

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
