---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Service worker, Vite PWA plugin, Firebase Cloud Messaging, offline data hooks, PWA install flow — NOTE: this repo has no service worker of its own, no Firebase; see scope note
---

# PWA & Offline Support

## Scope note: no service worker, no Firebase, in this repo

This repo has no `src/sw.ts`, no `vite-plugin-pwa` service worker, and no `src/lib/firebase.ts` — `src/main.tsx` actively **purges any foreign service worker** it finds on boot (so a leftover PWA/Workbox worker can't intercept and 404 the MSW-mocked API calls this prototype relies on). The PWA install-prompt capture (`beforeinstallprompt`/`appinstalled` listeners) genuinely does exist, but lives in a local component inside `src/RouterWrapper.tsx` (also named `AppShell` there, unrelated to `src/Routes/AppShell.tsx`) rather than in an `AmplitudeTrackerWrapper` — see [`routing.md`](./routing.md)'s scope note. `useOfflinePatientData`/`useOffline`/`usePersistentBalance` are real and accurate as described below. The Firebase Cloud Messaging and `src/sw.ts` sections describe the target production architecture only.

## Why This Matters

Jireh's primary users are in Kenya on mobile devices, often on 3G or slower connections. The app targets Android home-screen install via the browser's "Add to Home Screen" prompt. PWA reliability is a core product requirement — a user managing a medical payment cannot afford the app to fail when connectivity drops.

---

## Service Worker (`src/sw.ts`)

The service worker is built and injected by `vite-plugin-pwa`. Key characteristics:
- Workbox-based caching strategy
- Maximum cache size: **5MB**
- Handles push notification receipt and display (Firebase Cloud Messaging)
- Handles `notificationclick` events to open relevant app URLs

Do not modify `src/sw.ts` without understanding the PWA implications. A broken service worker can cause users to be stuck on a cached version of the app indefinitely.

---

## Vite PWA Plugin (`vite.config.ts`)

`vite-plugin-pwa` injects the service worker and generates the web app manifest. Configuration lives in `vite.config.ts`. The `dev-dist/` folder is generated during development and should be treated as build output.

---

## Firebase Cloud Messaging (`src/lib/firebase.ts`)

Firebase is used exclusively for push notifications. The Firebase app is configured via `VITE_FIREBASE_*` environment variables. Key files:

- `src/lib/firebase.ts` — Firebase app initialisation
- `src/hooks/usePushNotifications.ts` — Requests notification permission, registers FCM token
- `src/hooks/useRequestNotificationAccess.ts` — UI flow for requesting permission

---

## PWA Install Prompt

The install prompt lifecycle is managed globally in `AmplitudeTrackerWrapper` (`src/RouterWrapper.tsx`):

1. `beforeinstallprompt` event is captured and stored on `window.__deferredPWAInstallPrompt`
2. A custom `pwa:beforeinstallprompt` event is dispatched so any component can subscribe
3. `appinstalled` event clears the stored prompt and dispatches `pwa:installed`

The `usePwaInstall` hook (`src/hooks/usePwaInstall.ts`) provides a clean interface for components to trigger the install prompt.

### PWA Onboarding Flow

A dedicated `/patients/pwa-onboarding` route guides new users through installing the app. This flow tracks events in the `PWA_INSTALL` Amplitude journey.

---

## Offline Data Support

### `useOfflinePatientData` (`src/hooks/useOfflinePatientData.ts`)

Caches the patient's login details in **IndexedDB** (`JirehHealthDB`). When the device is offline, React Query falls back to this cached data.

- Database is cleared on logout (see `patientAuthStore.signOut()`)
- Only stores non-sensitive, display-safe patient data

### `useOffline` (`src/hooks/useOffline.ts`)

Provides a boolean `isOffline` state derived from `navigator.onLine` and `online`/`offline` events. Use this to show offline indicators or disable network-dependent actions.

### `usePersistentBalance`

Similar pattern — persists balance data across sessions so users see meaningful numbers even before the network response arrives.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | VAPID key for web push |

---

## Considerations When Making Changes

- Any change that affects caching strategy in `sw.ts` can leave users stuck on a stale build — test the update path
- The 5MB cache limit is intentional — do not add large assets that would exceed it
- PWA assets (icons, manifest) in `public/` are served as-is — keep icon files optimised
- Test offline behaviour by using Chrome DevTools > Network > Offline
