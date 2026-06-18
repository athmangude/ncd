import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

/**
 * Remove any stale service worker that isn't ours (e.g. the old PWA/Workbox
 * worker from the original app). A leftover worker controlling this origin would
 * intercept our API calls before MSW can, causing 404s. If a foreign worker is
 * currently controlling the page, we unregister it, clear its caches, and reload
 * once so the next load is free for MSW to take over.
 */
async function purgeStaleServiceWorkers(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false

  const controller = navigator.serviceWorker.controller
  const isForeignController =
    controller && !controller.scriptURL.includes("mockServiceWorker")

  const registrations = await navigator.serviceWorker.getRegistrations()
  const stale = registrations.filter(
    (reg) =>
      !(
        reg.active?.scriptURL.includes("mockServiceWorker") ||
        reg.installing?.scriptURL.includes("mockServiceWorker") ||
        reg.waiting?.scriptURL.includes("mockServiceWorker")
      )
  )

  if (stale.length === 0 && !isForeignController) return false

  await Promise.all(stale.map((reg) => reg.unregister()))
  if (window.caches) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }

  // A foreign worker still controls this page; a one-time reload hands the next
  // load to MSW. Guard with sessionStorage so we never reload-loop.
  if (isForeignController && !sessionStorage.getItem("sw-purged")) {
    sessionStorage.setItem("sw-purged", "1")
    return true
  }
  return false
}

async function bootstrap() {
  const needsReload = await purgeStaleServiceWorkers()
  if (needsReload) {
    window.location.reload()
    return
  }

  // Start the in-browser mock API (Mock Service Worker) before rendering so the
  // first data requests are intercepted. Everything runs from local fixtures +
  // localStorage — there is no backend.
  const { startMockServiceWorker } = await import("./mocks/browser")
  await startMockServiceWorker()

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
