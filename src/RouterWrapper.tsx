import {
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom"
import Home from "./Routes/Home"
import ErrorPage from "./Routes/ErrorPage"
import VerifyEmailPage from "./Routes/VerifyEmailPage"
import PatientWrapper from "./Routes/Patient/PatientWrapper"
import UnauthorizedPage from "./Routes/UnauthorizedPage"
import InvalidTenantPage from "./Routes/InvalidTenantPage"
import { useEffect } from "react"
import JoinCircleRedirect from "./Routes/JoinCircleRedirect"
import FacilitatorPanel from "./Routes/Facilitator/FacilitatorPanel"

// Hash routing is used so the prototype works on GitHub Pages, which has no
// server-side SPA fallback — deep links and refreshes resolve client-side.
const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />, // Root wrapper
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/circles/join", element: <JoinCircleRedirect /> },
      { path: "/circles/join/qr", element: <JoinCircleRedirect /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/patients/*", element: <PatientWrapper /> },
      { path: "/facilitator", element: <FacilitatorPanel /> },
      { path: "/unauthorized", element: <UnauthorizedPage /> },
      { path: "/invalid-tenant", element: <InvalidTenantPage /> },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
])

export default function RouterWrapper() {
  return <RouterProvider router={router} />
}

function AppShell() {
  // Capture and defer the PWA install prompt globally so the in-app install
  // card can trigger it. (Harmless if the browser never fires the event.)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as Event
      ;(
        window as unknown as Record<string, unknown>
      ).__deferredPWAInstallPrompt = event
      window.dispatchEvent(
        new CustomEvent("pwa:beforeinstallprompt", { detail: event })
      )
    }
    const handleAppInstalled = () => {
      ;(
        window as unknown as Record<string, unknown>
      ).__deferredPWAInstallPrompt = null
      window.dispatchEvent(new CustomEvent("pwa:installed"))
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  return <Outlet />
}
