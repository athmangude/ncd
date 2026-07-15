---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: React Router v6 structure, nested routes, protected routes — this repo (ux-prototype) is Patient-portal-only, MSW-mocked, hash-routed
---

# Routing

## Scope note: this repo is `ux-prototype`, not `jireh-core-client`

Several docs in this `context/architecture/` set (including this one, at earlier revisions) were written against the production `jireh-core-client` architecture — Organizations/Guarantor portals, SuperTokens Multitenancy, `AmplitudeTrackerWrapper`, a real backend. **This repo does not have any of that.** `src/RouterWrapper.tsx`, `src/Home.tsx`, and `src/main.tsx` confirm:

- Only the **Patient** portal exists (`src/Routes/Patient/`) — there is no `src/Routes/Organizations/` directory in this repo's history at all (it exists only in an unrelated, non-ancestor commit lineage).
- There is no real backend — `src/main.tsx` boots **MSW** (Mock Service Worker) before rendering `<App />`; all data is served from local fixtures + `localStorage`. It also actively purges any *foreign* (non-MSW) service worker so a leftover PWA worker can't intercept and 404 the mocked API calls.
- Routing is `createHashRouter` (not `createBrowserRouter`) specifically so deep links and refreshes work on GitHub Pages, which has no server-side SPA fallback.
- There is no `AmplitudeTrackerWrapper` — Amplitude page-time tracking as described below does not exist in this codebase.

Treat this file as the ground truth for **this repo's actual routes**; treat `architectural-overview.md`/`portal-isolation.md`'s multi-portal/Multitenancy content as describing the target production architecture the prototype is designed against, not this repo's current code.

---

## Framework

React Router DOM v6 using `createHashRouter` (`src/RouterWrapper.tsx`). Nested routes use the `<Outlet />` pattern via a local component (also confusingly named `AppShell` in this file — unrelated to the page-shell primitive `src/Routes/AppShell.tsx`; this one just captures the PWA `beforeinstallprompt` event on mount).

---

## Route Tree

```
/ (local AppShell wrapper in RouterWrapper.tsx — PWA install-prompt capture only)
├── /                          → Home (session check → /patients/ or splash)
├── /circles/join              → JoinCircleRedirect
├── /circles/join/qr           → JoinCircleRedirect
├── /verify-email              → VerifyEmailPage
├── /patients/*                → PatientWrapper
├── /facilitator                → FacilitatorPanel (consolidated Facilitator Tools — scenario
│                                  seeding, balance/loan flows; a dev/demo utility, not a portal)
├── /unauthorized               → UnauthorizedPage
├── /invalid-tenant             → InvalidTenantPage
└── *                           → Navigate to /
```

There is no `/organizations/*` or `/guarantors/*` route in this repo — the Organization and Guarantor portals described in `architectural-overview.md`/`portal-isolation.md` are not implemented here.

---

## Patient Portal Routes (`/patients/*`)

Handled by `PatientWrapper` (`src/Routes/Patient/PatientWrapper.tsx`). On entry:
- Calls `useTenantAccessControl({ setTenantIdValue: "patients" })`
- Calls `useSetAmplitudeUserId()` to identify the user in Amplitude

Patient routes are defined across multiple wrapper files. Key route groups (not exhaustive — see `PatientsHome.tsx` for the full list):

- `/patients/auth` → PatientSignUp (unauthenticated)
- `/patients/auth/otp` → PatientOTP (unauthenticated)
- `/patients/` → PatientDashboard (behind SessionAuth)
- `/patients/home` → PatientDashboardLoansTab
- `/patients/circle` → PatientDashboardCircleTab
- `/patients/explore` → PatientDashboardExploreTab
- `/patients/profile` → PatientDashboardProfileTab
- `/patients/fast-track/*` → FastTrackWrapper (in-network payment)
- `/patients/payment/*` → PaymentRequestWrapper (request payment)
- `/patients/payments/*` → PaymentWrapper (payment history/details: history index, /payment-details/:id, /how-you-paid/:id)
- `/patients/loans/*` → LoanWrapper
- `/patients/network/*` → PatientNetworkWrapper
- `/patients/care-fund/*` → PatientCareFundRoutes
- `/patients/insurance/*` → PatientInsuranceWrapper
- `/patients/subscriptions/*` → PatientSubscriptionsWrapper
- `/patients/discover-hospitals` → PatientDiscoverHospitals (Mapbox map)
- `/patients/facility/:id` → FacilityDetailsPage
- `/patients/pwa-setup-intro` → PWAOnboardingIntro
- `/patients/pwa-install` → InstallAppPage
- `/patients/pwa-notifications` → EnableNotificationsPage
- `/patients/id-verification` → PatientIdVerification (KYC)
- `/patients/document-verification` → PatientDocumentVerification (KYC)
- `/patients/notifications` → PatientNotificationsPage

Note: There is no `/patients/discovery` route. The discovery/map feature is at `/patients/discover-hospitals`.

---

## Organization Portal — Not Implemented in This Repo

There is no Organization portal in `ux-prototype`. No `/organizations/*` route, no `OrgWrapper`, no `src/Routes/Organizations/` directory exists in this repo's history. An `/organizations/how-it-works` informational page exists under the Patient route tree (`PatientsHome.tsx`), but it is Patient-portal content, not an org portal. If this content is needed, see the production `jireh-core-client` repo instead.

---

## Facilitator Tools (`/facilitator`)

`FacilitatorPanel` (`src/Routes/Facilitator/FacilitatorPanel.tsx`) is a consolidated dev/demo utility — not a user-facing portal — for seeding mock scenarios and manipulating balance/loan state directly against the MSW-backed mock data layer, so screenshots/QA/demos can jump straight to a given app state. `src/Routes/Facilitator/reloadApp.ts` provides reload-safe state so panel actions survive a full page reload (needed because state lives in `localStorage`/IndexedDB via MSW handlers, not a real backend).

---

## Route Protection Pattern

`supertokens-web-js` is used for its client API surface (`Session.doesSessionExist()`, `Session.getAccessTokenPayloadSecurely()`), but in this repo the recipe itself is **mocked** (`src/mocks/auth/recipe-session-react.tsx`, wired in via MSW) rather than talking to a real SuperTokens core — there is no live multi-tenant backend to validate against.

### 1. Session presence check

`RedirectIfSessionExists` (`PatientWrapper.tsx`) and `Home.tsx` both call `Session.doesSessionExist()` directly to decide whether to show auth screens or bounce straight to the dashboard. There is no `SessionAuth` wrapper component gating the Patient routes in this repo — session-existence is checked ad hoc at the specific entry points that need it (auth pages, `/`), not via a boundary component wrapping the whole authenticated subtree.

### 2. Tenant Access Control

`useTenantAccessControl` (`src/hooks/useTenantAccessControl.ts`) still runs in `PatientWrapper` and still behaves as designed against the mock: it writes `localStorage["tenantId"]`, then (if a mock session exists) reads the access-token payload's `tId` and redirects to `/invalid-tenant` on a mismatch. Since only the `"patients"` tenant is ever set in this repo, this exists mainly as a guard against a corrupted/foreign session, not to separate multiple live portals:

```typescript
useTenantAccessControl({ setTenantIdValue: "patients" })
```

---

## Adding a New Route

1. Add the route definition inside `PatientWrapper` (top-level auth/invite routes) or `PatientsHome` (everything else, nested under `/patients/*`)
2. Create the page component in the corresponding `Pages/` directory
3. Add any relevant Amplitude events to `src/analytics/events.ts` for the new journey
4. If the route needs analytics page-view tracking, add a `trackEvent(EVENTS.MY_JOURNEY.PAGE_VIEW)` call in the page component's `useEffect`
5. If the screen needs page chrome, wrap it with `PatientPageWrapper`, `PatientAuthWrapper`, or `StatusPageWrapper` — never import `AppShell` directly (see [`component-system.md`](./component-system.md))
