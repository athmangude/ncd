---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: High-level architecture of jireh-core-client — portals, tech stack, folder layout, build pipeline, AppShell page-shell architecture, dashboard entrance animation
---

# Architectural Overview — jireh-core-client

## What This App Is

`jireh-core-client` is a **production React SPA** serving as the primary user-facing interface for Jireh Health's healthcare financing platform in Kenya. It is a **Progressive Web App (PWA)** — installable on Android and iOS — optimised for mobile users on low-bandwidth connections. **This describes the target production architecture.** This repo (`ux-prototype`) is a design/UX prototype of the Patient portal only — MSW-mocked, no real backend, no PWA service worker of its own (it purges any foreign one on boot), hash-routed for GitHub Pages hosting. See [`routing.md`](./routing.md)'s scope note for the concrete differences before relying on anything below as "what this repo's code currently does."

Two active portals are served from the same codebase in the target architecture, with a third planned — **only Patient is implemented in this repo**:

| Portal | URL prefix | Tenant ID | Users | Status (target `jireh-core-client`) | Status (this repo, `ux-prototype`) |
|--------|-----------|-----------|-------|--------|--------|
| Patient | `/patients/*` | `patients` | Patients and anchor caregivers managing healthcare payments, savings, loans | Live | Live — the only portal this repo implements |
| Organization | `/organizations/*` | `organizations` | Healthcare provider staff managing facilities, invoices, wallet, members | Live | **Not implemented** — no `src/Routes/Organizations/`, no route |
| Guarantor | `/guarantors/*` | `guarantors` | Financial co-signatories for loan underwriting | Planned | **Not implemented** |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3 |
| Language | TypeScript 5.7 |
| Build | Vite 6.2 (SWC plugin, Terser minification) |
| Routing | React Router DOM v6 (browser router, nested routes) |
| Client state | Zustand 5 |
| Server state | TanStack React Query 5 |
| Styling | Tailwind CSS 3.4 + Radix UI primitives + shadcn/ui patterns |
| Forms | React Hook Form 7 |
| Auth | SuperTokens (multi-recipe, multi-tenant) |
| HTTP | Axios 1.8 |
| Analytics | Amplitude v2 + Session Replay |
| Error tracking | Sentry v8 |
| PWA | Vite PWA plugin + custom service worker (`src/sw.ts`) |
| Push notifications | Firebase Cloud Messaging |
| Payments | Paystack Inline JS |
| Identity verification | Smile Identity Smart Camera |
| Maps | Mapbox GL + React Map GL |
| Animations | Framer Motion 12 |

---

## Folder Structure

```
src/
├── App.tsx                      # Root: SuperTokens init, QueryClient, Amplitude init
├── main.tsx                     # Entry: mounts App, registers service worker
├── RouterWrapper.tsx            # React Router config + AmplitudeTrackerWrapper
│
├── Routes/
│   ├── AppShell.tsx             # Private page-shell primitive — see "Page-Shell Architecture" below
│   ├── shell/                   # headers.tsx, footers.tsx, PageHeader.tsx, StepperHeader.tsx,
│   │                            # useJourneyStepper.ts, StatusPageWrapper.tsx
│   ├── Facilitator/             # Consolidated Facilitator Tools (scenario seeding, balance/loan
│   │                            # flows) — FacilitatorPanel.tsx, reloadApp.ts; routed at /facilitator
│   ├── Patient/                 # Patient portal — largest subsection
│   │   ├── PatientWrapper.tsx   # Nested router, tenant guard ("patients")
│   │   ├── Pages/               # Page-level components (Dashboard, Loans, Payment, etc.)
│   │   ├── components/          # Patient-specific UI components (incl. PatientAuthWrapper)
│   │   ├── hooks/               # Patient-specific hooks
│   │   ├── stores/              # Zustand stores (patientAuthStore, patientLoanStore)
│   │   ├── utilities/           # Patient-specific utilities
│   │   └── enums/ constants/ models/
│   │
│   └── Organizations/           # Organization portal
│       ├── OrgWrapper.tsx       # Nested router
│       ├── OrgHomeWrapper.tsx   # SessionAuth protection wrapper
│       ├── Auth/                # Org login, signup, email verification
│       ├── Pages/               # Org dashboard pages (Loans, Members, Settings)
│       ├── components/          # Org UI components
│       ├── hooks/               # Org-specific hooks
│       └── stores/              # Zustand stores (orgUserStore)
│
├── components/                  # Shared UI library (~80 components)
│   ├── form/                    # FormGroup* components wrapping react-hook-form
│   ├── auth/                    # Auth-specific shared components
│   ├── typography/              # DashboardTitle, Title
│   ├── ProtectedResource.tsx    # Role-based access control wrapper
│   └── [Radix/shadcn primitives] Button, Dialog, Tabs, Sheet, etc.
│
├── hooks/                       # Shared custom hooks (11 files)
│   ├── useTenantAccessControl.ts
│   ├── usePatientLoginDetails.ts
│   ├── useOfflinePatientData.ts
│   ├── usePersistentForm.tsx
│   └── [PWA and notification hooks]
│
├── analytics/                   # Amplitude + Sentry instrumentation
│   ├── events.ts                # All event constants (JOURNEY:Stage:action)
│   ├── tracking.ts              # trackEvent(), trackPageView(), flushEvents()
│   ├── types.ts
│   ├── userProperties.ts
│   └── metadata.ts
│
├── utilities/                   # Cross-app utilities
│   ├── currencyUtilities.tsx
│   ├── dateUtilities.tsx
│   ├── localStorage.tsx
│   ├── textUtilities.tsx
│   ├── validators.tsx
│   ├── sentry.tsx               # Sentry init
│   └── serviceWorker.tsx        # PWA SW utilities
│
├── lib/
│   ├── utils.ts                 # cn() — Tailwind class merging
│   └── firebase.ts              # Firebase app config
│
├── data/                        # Static data (FAQs, M-Pesa guide)
├── types/                       # Shared TypeScript interfaces
├── assets/                      # Icons and images
├── index.css                    # Global Tailwind + CSS variable definitions
└── sw.ts                        # PWA Service Worker (Workbox-based)
```

---

## Application Bootstrap Sequence

1. **`main.tsx`** — Mounts `<App />`, registers the PWA service worker
2. **`App.tsx`** (module-level, runs once) — SuperTokens init, Axios interceptors (dev only), QueryClient construction, Amplitude init with Session Replay
3. **`App.tsx`** (render) — Provides `QueryClientProvider`, renders `<RouterWrapper>`, conditionally renders `<Agentation>` (non-production only)
4. **`RouterWrapper.tsx`** — Creates browser router with `AmplitudeTrackerWrapper` as root layout; page-time tracking begins
5. **Portal wrappers** — `PatientWrapper` or `OrgWrapper` validates tenant ID, then renders nested routes

---

## Build Pipeline

| Environment | Command | Notes |
|------------|---------|-------|
| Dev | `npm run dev` | Vite HMR, header-based session tokens |
| Staging | `npm run build:staging` | `--mode staging`, Agentation visible |
| Production | `npm run build` | Agentation hidden, console/debugger stripped |

Docker targets: `make build-{development,staging,production}` on ports 3001/3002/3003.

CI (`.github/workflows/ci.yml`) runs on push to `main`/`develop`: install → build → lint.

---

## Key Architectural Decisions

- **Single SPA, not micro-frontends** — All portals share one bundle. Portal isolation is enforced by routes and SuperTokens tenant IDs, not separate deployments.
- **No global Redux** — Server state is React Query's job; client state uses small Zustand stores scoped to each portal.
- **Cookie vs header tokens** — Production uses cookies (same-domain); local dev uses Authorization headers because `localhost` cannot share cookies with the remote API domain. See [`authentication.md`](./authentication.md).
- **PWA-first** — The app targets Android home-screen install. Bundle size, offline support, and service worker health are first-class concerns.
- **Analytics are mandatory, non-crashing** — Every user action that matters is tracked. `trackEvent()` wraps Amplitude in a try-catch so telemetry never breaks the UX.
- **One page-shell primitive, reached only through archetype wrappers** — see below.

---

## Page-Shell Architecture (AppShell)

Every screen in the app renders through **`src/Routes/AppShell.tsx`** — a single private primitive providing a centered `max-w-md` card, pinned header/footer slots, and internal scroll with safe-area handling. `MobileWrapper` (the old shell) was deleted after the AppShell migration (Phases 0–8 + closeout, see `git log` for `refactor(layout):` commits). Screens never import `AppShell` directly — an ESLint `no-restricted-imports` rule in `eslint.config.js` blocks it — they go through one of three archetype wrappers:

| Wrapper | Used for |
|---------|----------|
| `PatientPageWrapper` (`src/Routes/Patient/Pages/PatientPageWrapper.tsx`) | Standard/journey screens. Has a `variant: "legacy" \| "content"` prop — `content` renders a slim borderless app bar plus a content-level `PageHeader` (icon/title/description/stepper) as the first child of the body. |
| `PatientAuthWrapper` (`src/Routes/Patient/components/PatientAuthWrapper.tsx`) | Auth/onboarding screens — canonical `LogoHeader` bar. |
| `StatusPageWrapper` (`src/Routes/shell/StatusPageWrapper.tsx`) | Chrome-less status pages (loading/error/unauthorized/invalid-tenant/verify-email). |

A short, explicitly allowlisted set of screens import `AppShell` directly because their layout is genuinely bespoke: `PatientDashboard.tsx` (fixed tab-bar shell), `SplashScreens.tsx`, `Facilitator/FacilitatorPanel.tsx`, and `PatientSubscriptionsTransactionResult.tsx`. See [`component-system.md`](./component-system.md) for the full wrapper API (props, `logoHeader`, `useJourneyStepper`) and [`context/architecture/.context-version`](./.context-version)-adjacent per-journey docs for how individual flows use it.

## Dashboard Entrance Animation

The four dashboard tabs (home/explore/circle/profile, `src/Routes/Patient/Pages/PatientDashboard.tsx` + `Dashboard/`) share one staggered fade/slide-in animation on first load, backed by a shared skeleton while data loads — `DashboardStagger`/`DashboardSection`, `DashboardSkeleton`, `DashboardTabFallback` (the `Suspense` fallback for the lazy-loaded tab routes), and `useDashboardFirstLoad` (distinguishes first mount from a background refetch so the animation plays once per session, not on every refetch). See [`component-system.md`](./component-system.md) for file locations.

---

## Detailed Architecture Docs

| Topic | File |
|-------|------|
| Authentication & sessions | [authentication.md](./authentication.md) |
| State management | [state-management.md](./state-management.md) |
| Routing & portal isolation | [routing.md](./routing.md) |
| Component system & design tokens | [component-system.md](./component-system.md) |
| API layer & data fetching | [api-layer.md](./api-layer.md) |
| Analytics & error tracking | [analytics.md](./analytics.md) |
| PWA & offline support | [pwa-and-offline.md](./pwa-and-offline.md) |
| Forms | [forms.md](./forms.md) |
| Testing strategy | [testing-strategy.md](./testing-strategy.md) |
