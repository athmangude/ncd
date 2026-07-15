---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Amplitude event structure, trackEvent(), Sentry setup, session replay, page-time tracking, user identification — NOTE: this repo's trackEvent()/trackPageView()/flushEvents() are no-op stubs, see scope note
---

# Analytics & Error Tracking

## Scope note: `trackEvent()` is a no-op stub in this repo

`src/analytics/tracking.ts` in this repo is explicitly documented in its own header comment as a **"standalone prototype stub"**: `trackEvent()`, `trackPageView()`, and `flushEvents()` all take the same signature as the production implementation but do nothing (`// no-op`) — there is no Amplitude SDK call anywhere in this file. This exists so the ~300+ `trackEvent(EVENTS.X.Y)` call sites across the app compile and run without needing a real Amplitude API key. The event **taxonomy** in `src/analytics/events.ts` (`EVENTS.SIGNUP`, `.PAYMENT`, `.KYC`, etc.) is real and should still be treated as the source of truth for event naming — new journeys should still add events there — but nothing is actually sent anywhere in this repo. There is also no `src/utilities/sentry.tsx`, no Sentry SDK init, and no `AmplitudeTrackerWrapper` in `src/RouterWrapper.tsx` (see [`routing.md`](./routing.md)'s scope note) — the Amplitude-init, session-replay, and Sentry sections below describe the target `jireh-core-client` architecture, not this repo's current code.

## Tools

| Tool | Purpose |
|------|---------|
| **Amplitude v2** | User behaviour analytics, funnel analysis |
| **Amplitude Session Replay** | Screen recordings (10% sample rate) |
| **Sentry v8** | Runtime error capture, source maps, release tracking |

---

## Amplitude Initialisation (`src/App.tsx`)

Amplitude is initialised once at module level with a guard to prevent HMR re-initialisation:

```typescript
let amplitudeInitialized = false

const initializeAmplitude = () => {
  if (amplitudeInitialized) return

  const sessionReplayTracking = sessionReplayPlugin({
    sampleRate: 0.1,                          // 10% of sessions recorded
    performanceConfig: { enabled: true },
    privacyConfig: {
      blockSelector: [".no-track", "#ads"],
      defaultMaskLevel: "medium",
      maskSelector: [".sensitive-data", ".user-email"],
      unmaskSelector: [".public-info", "#main-content"],
    },
  })

  amplitude.init(VITE_AMPLITUDE_API_KEY, {
    autocapture: { elementInteractions: true }, // Auto-captures clicks
    defaultTracking: { sessions: true },
    serverZone: "EU",                           // GDPR — data stays in EU
  })

  amplitude.add(sessionReplayTracking)
  amplitudeInitialized = true
}
```

**Privacy:** Elements with class `no-track` or `sensitive-data` or `user-email` are masked in session replays. Add these classes to any component rendering PII.

---

## Event Naming Convention

All events follow the `JOURNEY:Stage:action` pattern:

```
SIGNUP:PhoneEntry:submit
PAYMENT:PaymentConfirmation:success
KYC:IdVerification:error
FAST_TRACK_PAYMENT:Payment:completed
```

- **JOURNEY** — top-level user goal (all caps, underscores)
- **Stage** — screen or step within the journey (PascalCase)
- **action** — verb describing what happened (kebab-case)

---

## Event Constants (`src/analytics/events.ts`)

All event names are defined as constants in `EVENTS`. Never use raw strings for event names.

```typescript
import { EVENTS } from "@/analytics/events"

trackEvent(EVENTS.PAYMENT.PAYMENT_CONFIRMATION_SUCCESS, {
  amount: 5000,
  provider: "Aga Khan Hospital",
})
```

Current journeys: `SIGNUP`, `SIGNIN`, `PAYMENT`, `KYC`, `CARE_PROFILE`, `CIRCLE`, `LOAN_REPAYMENT`, `SUPPORT`, `FAST_TRACK_PAYMENT`, `PROFILE`, `DISCOVERY`, `PWA_INSTALL`, `NOTIFICATIONS`.

**When adding a new journey:** Add the new journey block to `EVENTS` in `src/analytics/events.ts` before using it anywhere.

---

## `trackEvent()` (`src/analytics/tracking.ts`)

The safe wrapper around Amplitude. Always use this — never call `amplitude.track()` directly.

```typescript
trackEvent(eventName: string, properties?: TrackEventProperties): void
```

- Adds `timestamp` and `platform: "web"` automatically
- Wrapped in try-catch — analytics failures **never crash the app**
- Logs warnings to console in dev mode only
- Fires legacy aliases for PAYMENT events that were previously LOAN_REQUEST (backward-compat for existing Amplitude funnels — remove once migration is complete)

```typescript
// Also available:
trackPageView(pageName: string, properties?)   // Fires PAGE_VIEW:pageName
flushEvents()                                   // Force-flush before unload
```

---

## Page Time Tracking (`src/RouterWrapper.tsx`)

`AmplitudeTrackerWrapper` fires `time_spent_on_page` from two triggers with **different payload shapes**:

**Route change** (user navigates to a new route):
```typescript
amplitude.track("time_spent_on_page", {
  path: prevPath,           // previous route path
  durationInSeconds,        // whole seconds (Math.round)
  pageTitle: prevTitle,     // document.title at time of leaving
})
```

**Tab/window close** (`beforeunload` event):
```typescript
amplitude.track("time_spent_on_page", {
  path: currentPath,        // current route path
  duration,                 // milliseconds (NOT seconds), no Math.round
  // pageTitle is NOT included in beforeunload payload
})
```

This runs without any per-page instrumentation needed. Do not duplicate this logic in individual page components. When querying Amplitude, note the payload difference: `durationInSeconds` (route change) vs `duration` in ms (beforeunload).

---

## User Identification

Each portal wrapper calls `useSetAmplitudeUserId()` after login. This sets the Amplitude user ID so events from the same user are grouped together across sessions.

For user properties (e.g., plan type, KYC status), use `src/analytics/userProperties.ts` which wraps the Amplitude Identify API.

---

## Sentry (`src/utilities/sentry.tsx`)

Sentry is initialised with:
- **DSN hardcoded** in `src/utilities/sentry.tsx` (not from an env var — the DSN is a literal string in the source)
- Enabled only in `production` and `staging` environments
- React Router v6 browser tracing integration
- Replay integration: 10% session sample rate, 100% on errors
- Traces sample rate: 100%
- Source maps uploaded during CI build and cleaned up after (configured in `vite.config.ts`)

Note: The Sentry ingest endpoint is on `de.sentry.io` (EU region ingest endpoint).

Sentry captures unhandled promise rejections and JS errors automatically. For manual capture:

```typescript
import * as Sentry from "@sentry/react"

Sentry.captureException(error)
Sentry.captureMessage("Something notable happened", "warning")
```

---

## Guardrail: Every New User Journey Needs Events

When implementing a new user-facing feature or flow:
1. Define all events in `src/analytics/events.ts` as a new journey block
2. Call `trackEvent(EVENTS.MY_JOURNEY.STAGE_VIEW)` on page mount
3. Call `trackEvent(EVENTS.MY_JOURNEY.SUBMIT)` on form submission
4. Call `trackEvent(EVENTS.MY_JOURNEY.SUCCESS)` / `ERROR` on outcome
5. Add `.sensitive-data` class to any input rendering PII (session replay masking)
