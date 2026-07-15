# Context Index — jireh-core-client

Quick-reference for AI agents. Read this file first, then open only the specific doc you need.

**Repo:** React 18 + TypeScript SPA — Patient portal, Organization (healthcare provider) portal, Guarantor portal.

---

## How to use this index

1. Identify your topic below
2. Read only the linked file(s) — never scan all docs blindly
3. If a file's description matches your task, open it. If two match, open both.

---

## Meta — Read First for Issues or Gaps

| File | What's in it |
|------|-------------|
| [`KNOWN-ISSUES.md`](./KNOWN-ISSUES.md) | Confirmed bugs: guarantor portal not implemented, `patientLoanStore` is dead code |
| [`CONFLICTS.md`](./CONFLICTS.md) | Design ambiguities: multi-source loan flow state (localStorage + Router + RHF), patientLoanStore never populated, offline writes not synced |
| [`GAPS-CHECKLIST.md`](./GAPS-CHECKLIST.md) | Tracking checklist of all context gaps and their completion status |

---

## Architecture Fundamentals

| File | What's in it |
|------|-------------|
| [`architecture/architectural-overview.md`](./architecture/architectural-overview.md) | App-wide structure: three portals, tech stack table, folder layout, key dependencies, entry points |
| [`architecture/authentication.md`](./architecture/authentication.md) | SuperTokens multi-tenant setup, Passwordless + Social login, session token strategy (cookie vs header), tenant IDs, `SessionAuth` route guard |
| [`architecture/routing.md`](./architecture/routing.md) | React Router v6 structure, nested routes, `SessionAuth` protection, `AmplitudeTrackerWrapper`, portal route namespaces |
| [`architecture/portal-isolation.md`](./architecture/portal-isolation.md) | How Patient (`/patients/*`), Org (`/organizations/*`), and Guarantor portals are isolated — tenant IDs via localStorage, per-portal Zustand stores, signOut cleanup, shared vs portal-specific components |
| [`architecture/state-management.md`](./architecture/state-management.md) | Zustand stores (`patientAuthStore`, `orgUserStore`, `patientLoanStore`), React Query config, when to use which, **localStorage dominance** section (17+ keys, shapes, fallback chains, cleanup gaps) |
| [`architecture/component-system.md`](./architecture/component-system.md) | Radix UI + shadcn/ui patterns, CVA for variants, `cn()` utility, design tokens (Tailwind colors/CSS vars), component file structure |
| [`architecture/api-layer.md`](./architecture/api-layer.md) | Axios instances, React Query patterns (queries, mutations, dependent queries), environment variable config, base URL setup |
| [`architecture/forms.md`](./architecture/forms.md) | React Hook Form patterns, `usePersistentForm` hook (localStorage-backed multi-step form persistence), `FormGroup*` components, validation patterns |
| [`architecture/testing-strategy.md`](./architecture/testing-strategy.md) | Current state (no tests), recommended Vitest + RTL setup, patterns to follow, 100% coverage requirement |

---

## Patient Journeys & Flows

| File | What's in it |
|------|-------------|
| [`architecture/patient-onboarding-journey.md`](./architecture/patient-onboarding-journey.md) | Phase 1: OTP → personal details → PIN setup. Phase 2: KYC + membership. `ONBOARDING_STEP_CONFIG`, `useNextOnboardingStep` hook, SuperTokens Passwordless flow, tenant default behaviour |
| [`architecture/kyc-verification.md`](./architecture/kyc-verification.md) | 4 KYC steps — ID number entry, SmileID document capture, SmileID selfie, circle members requirement. KES 499 membership payment gate. What features are locked behind KYC completion |
| [`architecture/loan-application-journey.md`](./architecture/loan-application-journey.md) | **Full 7-step loan flow** — route sequence, `patientReviewInvoice` localStorage shape, `ProtectedLoanStep` guard logic, wallet allocation object shape, discount code application, PIN OTP confirmation, fallback chain (localStorage → Router state → React Query). **Read this before touching any loan page** |
| [`architecture/fast-track-payment.md`](./architecture/fast-track-payment.md) | Pre-authorized repeat payments — `useFastTrackStore` Zustand shape with `localStorage["fast-track-storage"]` persistence, `FastTrackStepGuard` validation matrix, `InitiateFastTrackPaymentDto`, differences from standard invoice flow |
| [`architecture/care-fund-journey.md`](./architecture/care-fund-journey.md) | Care Fund (CASHBACK) from the patient's perspective — balance data source, redemption in wallet selection step, transaction history types, gifting flow, Care Saver savings (waitlisted) |
| [`architecture/circle-and-network-journeys.md`](./architecture/circle-and-network-journeys.md) | Adding connections, invite methods (text/voice/standard), `PENDING_INVITE_KEY` localStorage, `callbackMap` for mid-payment connection adds, KYC circle requirement, how circle status gates loan eligibility |
| [`architecture/discovery-and-map.md`](./architecture/discovery-and-map.md) | Provider discovery — `useDiscovery` hook, `sessionStorage["discovery_tab_state"]` persistence, Mapbox integration, `useSupercluster` clustering, `latitude`/`longitude` as strings gotcha, search vs nearby modes, `@tanstack/react-virtual` scrolling |

---

## Analytics, PWA & Offline

| File | What's in it |
|------|-------------|
| [`architecture/analytics.md`](./architecture/analytics.md) | Amplitude events structure (`JOURNEY:Stage:action`), Sentry setup, session replay, page time tracking, user identification, `trackEvent()` wrapper |
| [`architecture/pwa-and-offline.md`](./architecture/pwa-and-offline.md) | Service worker (`sw.ts`), Vite PWA plugin config, Firebase Cloud Messaging push notifications, offline data hooks, what happens on stale builds |

---

## projects/

| File | What's in it |
|------|-------------|
| [`projects/README.md`](./projects/README.md) | What belongs in `context/projects/` (feature-specific technical specs) vs the external `jireh-master-context/` repo (PRDs, design artifacts) |
