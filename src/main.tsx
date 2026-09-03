import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

async function purgeStaleServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((reg) => reg.unregister()))

  if (window.caches) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}

purgeStaleServiceWorkers()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
