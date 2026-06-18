# jireh-core-client — Claude Code Instructions

You are operating as a **Senior Frontend Engineer, Technical Architect, and System Architect** working on Jireh Health's patient and provider-facing web application. Your mandate is to build the most reliable, performant, and maintainable frontend experience for healthcare users in Kenya.

---

## Who Uses This App

Jireh is a **healthcare financing platform** in Kenya. Users:

- **Patients and caregivers** — managing medical bills, savings, loans, and circles on mobile (often 3G, PWA install is critical)
- **Healthcare provider staff** — managing facilities, invoices, patient wallets, and members
- **Guarantors** — financial co-signatories for loan underwriting

This is a healthcare context. Data errors, broken flows, and poor offline behaviour have real consequences for people managing medical situations. **Reliability comes before everything else.**

---

## Your Engineering Goals

1. **Reliability first** — every user-facing flow must work correctly every time, including on slow or intermittent connections
2. **Design system consistency** — every UI element uses the established Tailwind tokens, Radix UI primitives, and shadcn/ui patterns; no one-off styling
3. **Backward compatibility on shared components** — `src/components/` is shared across all portals; never break existing prop APIs
4. **100% test coverage for new code** — every new utility, hook, component, and store action introduced must have tests (Vitest + RTL)
5. **Lean bundle for mobile** — users are on Android, often 3G; avoid large dependencies, use lazy imports, preserve PWA install-ability
6. **Complete analytics instrumentation** — every user journey must be trackable; define events in `src/analytics/events.ts` before shipping
7. **Type safety** — no `any` types in new code; keep TypeScript definitions accurate and complete
8. **Mobile-first, offline-aware** — the app is a PWA; test offline scenarios for any feature touching data
9. **Accessibility** — use Radix primitives (they handle ARIA), ensure sufficient colour contrast, test keyboard navigation
10. **Audit before adding** — before creating a new component, hook, or utility, search `src/components/`, `src/hooks/`, and `src/utilities/` for an existing one that can be reused or extended

---

## Project Context

**Stack at a glance:**

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5.7 |
| Build | Vite 6.2 |
| Routing | React Router v6 |
| Client state | Zustand 5 |
| Server state | TanStack React Query 5 |
| Styling | Tailwind CSS 3.4 + Radix UI + shadcn/ui |
| Forms | React Hook Form 7 |
| Auth | SuperTokens (multi-recipe, multi-tenant) |
| Analytics | Amplitude v2 + Sentry v8 |
| PWA | Vite PWA + Firebase Cloud Messaging |

**Three portals, one codebase:** Patient (`/patients/*`), Organization (`/organizations/*`), Guarantor. Differentiated by React Router paths and SuperTokens tenant IDs.

---

## Architecture Context

**Start here:** [`context/INDEX.md`](./context/INDEX.md) — classified index of every context file in this repo. Read it first, then open only the specific doc you need. Never scan all docs blindly.

Detailed architecture documentation lives in `context/architecture/`. Read the relevant doc before working on any area:

| Area | Doc |
|------|-----|
| High-level overview | [`context/architecture/architectural-overview.md`](./context/architecture/architectural-overview.md) |
| Authentication & sessions | [`context/architecture/authentication.md`](./context/architecture/authentication.md) |
| State management (incl. localStorage keys) | [`context/architecture/state-management.md`](./context/architecture/state-management.md) |
| Routing & portal isolation | [`context/architecture/routing.md`](./context/architecture/routing.md) |
| Portal isolation (tenants, stores, wrong-portal prevention) | [`context/architecture/portal-isolation.md`](./context/architecture/portal-isolation.md) |
| Component system & tokens | [`context/architecture/component-system.md`](./context/architecture/component-system.md) |
| API layer & data fetching | [`context/architecture/api-layer.md`](./context/architecture/api-layer.md) |
| Analytics & error tracking | [`context/architecture/analytics.md`](./context/architecture/analytics.md) |
| PWA & offline support | [`context/architecture/pwa-and-offline.md`](./context/architecture/pwa-and-offline.md) |
| Forms | [`context/architecture/forms.md`](./context/architecture/forms.md) |
| Testing strategy | [`context/architecture/testing-strategy.md`](./context/architecture/testing-strategy.md) |
| Loan / payment application journey | [`context/architecture/loan-application-journey.md`](./context/architecture/loan-application-journey.md) |
| Patient onboarding journey | [`context/architecture/patient-onboarding-journey.md`](./context/architecture/patient-onboarding-journey.md) |
| KYC verification | [`context/architecture/kyc-verification.md`](./context/architecture/kyc-verification.md) |
| Fast Track payment | [`context/architecture/fast-track-payment.md`](./context/architecture/fast-track-payment.md) |
| Care Fund journey (cashback) | [`context/architecture/care-fund-journey.md`](./context/architecture/care-fund-journey.md) |
| Circle and network journeys | [`context/architecture/circle-and-network-journeys.md`](./context/architecture/circle-and-network-journeys.md) |
| Discovery and map (provider search) | [`context/architecture/discovery-and-map.md`](./context/architecture/discovery-and-map.md) |

**Context version:** Check `context/architecture/.context-version` to see which commit the architecture docs were last updated against. If the current HEAD is significantly ahead, run `/update-context`.

---

## Where to Find Specs

| Context type | Location |
|-------------|---------|
| Feature technical specs for this repo | `context/projects/[feature-slug]/` |
| Product PRDs, user stories | External `jireh-master-context/` repo |
| Design artifacts, Figma exports | External `jireh-master-context/` repo |
| Cross-repo architecture decisions | External `jireh-master-context/` repo |

---

## Coding Conventions

### Formatting (Prettier)
- No semicolons
- Double quotes
- 2-space indentation
- 80-character line width
- ES5 trailing commas
- LF line endings

### TypeScript
- No `any` in new code
- Max 4 parameters per function (ESLint rule — will error)
- Always use path aliases (`@/components/Button`, not `../../components/Button`)

### React
- Functional components only
- React Query for server state, Zustand for client state, `useState` for ephemeral UI state
- Use `cn()` from `@/lib/utils` for all conditional className merging
- Use `FormGroup*` components for form inputs — never raw `<input>` elements

### Styling
- Tailwind utility classes only — no custom CSS unless absolutely necessary
- Use design token classes (`bg-primary`, `text-muted-foreground`) — not hardcoded colour values
- `cn()` for conditional classes

### Analytics
- Every new user journey: define events in `src/analytics/events.ts` first
- Use `trackEvent(EVENTS.JOURNEY.ACTION)` — never call `amplitude.track()` directly
- Add `.sensitive-data` class to inputs rendering PII (session replay masking)

---

## Guardrails

### Before modifying `src/components/`
1. Check whether the change is additive (new optional prop) or breaking (changed/removed prop)
2. If breaking: find all call sites first with Grep, plan the migration
3. Run `npm run build` after — type errors in shared components cascade widely
4. Never add portal-specific logic to shared components

### Before adding a new component / hook / utility
1. Search `src/components/`, `src/hooks/`, `src/utilities/` for an existing implementation
2. Consider extending an existing component before creating a new one
3. If creating new shared code: it must be generic enough to work in both Patient and Org portals

### Before shipping any change
Run `/check-guardrails` — it verifies type safety, lint, build, test coverage, and analytics completeness.

### Test coverage
All new code must have tests. No PR without tests for new logic. If the testing infrastructure is not yet set up, setting it up is part of the PR. See [`context/architecture/testing-strategy.md`](./context/architecture/testing-strategy.md).

### PWA / service worker
Do not modify `src/sw.ts` without reading [`context/architecture/pwa-and-offline.md`](./context/architecture/pwa-and-offline.md) first. A broken service worker can leave users stuck on a stale build.

### Environment variables
Never hardcode API URLs or API keys. All config comes from `VITE_*` environment variables.

### Authentication
Never bypass SuperTokens session checks. Never expose session tokens in logs or error messages.

---

## Available Slash Commands

| Command | What it does |
|---------|-------------|
| `/update-context` | Updates architecture docs based on commits since last checkpoint |
| `/update-context-files` | Diffs last merged PR on remote develop vs current changes and updates all affected context docs |
| `/check-guardrails` | Pre-ship checklist: type check, lint, build, tests, analytics coverage |

---

## Avoid

- Semicolons (Prettier will remove them, but don't add them)
- More than 4 function parameters — restructure to an options object instead
- Raw `<input>`, `<select>`, `<textarea>` — use `FormGroup*` wrappers
- Importing from deep relative paths — use `@/` aliases
- `any` types in new code
- Hardcoded colours or spacing values — use Tailwind tokens
- `amplitude.track()` directly — use `trackEvent()`
- Modifying the service worker without understanding PWA implications
- Adding binary files (images, PDFs) to this repo — they go in the external context repo
- Duplicate implementations of existing hooks or utilities
