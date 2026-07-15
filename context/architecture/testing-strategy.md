---
context_version: 2.0
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Actual current test setup — Vitest + RTL, 137+ test files, co-located convention, MSW mocking, primitive component tests (Item/ToggleGroup), what CI actually runs
---

# Testing Strategy

## Current State

Testing infrastructure is **live and in active use** — this is not a gap anymore. As of this writing there are **137+ `*.test.ts`/`*.test.tsx` files** across the codebase, covering shell primitives (`AppShell`, `PageHeader`, `StepperHeader`, `headers`, `useJourneyStepper`), shared components (`Item`, `ToggleGroup`, `FormGroupInput`), and dozens of Patient-portal screens and hooks.

**Important — CI does not currently run tests.** `.github/workflows/ci.yml` runs `typecheck` → `lint:ci` → a Prettier check on changed files → `build`. There is no `npm run test` (or coverage) step in CI as of this writing. Running `npm run test` (or `npm run test:watch`) locally is the only way tests are currently enforced — don't assume a red test suite would block a merge; check `.github/workflows/ci.yml` yourself if this matters for what you're shipping. There is no coverage threshold configured anywhere in this repo (`vite.config.ts`'s `test` block has no `coverage` key) — the CLAUDE.md "100% test coverage for new code" guardrail is enforced by convention/review, not tooling.

---

## Stack (Actually Configured)

| Tool | Role |
|------|------|
| **Vitest** (`^4.1.7`) | Test runner — shares `vite.config.ts`'s `defineConfig`, so path aliases and `define` values resolve identically to the app build |
| **@testing-library/react** + **jest-dom** | Component testing — behaviour-focused assertions |
| **@testing-library/user-event** | Simulated user interactions |
| **MSW** (`^2.7.0`) | Mocks the entire API surface — see below, this is not optional/test-only in this repo, it's how the whole app runs |
| **jsdom** | Test environment (`vite.config.ts`'s `test.environment: "jsdom"`) |

`vite.config.ts`'s `test` block, in full:
```typescript
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./src/test/setup.ts"],
  css: false,
},
```

### `src/test/setup.ts`

Two jsdom polyfills, both there because specific component trees need them:
- `ResizeObserver` no-op stub — the OTP input (`input-otp`) instantiates one on mount.
- `window.matchMedia` stub reporting "no match" — PWA-install detection (`usePwaInstall`/`useNextPWAOnboardingStep`), reached transitively whenever a test renders the canonical shell + journey stepper.

Also calls RTL's `cleanup()` in `afterEach` globally, so individual test files don't need to.

### package.json scripts

```json
"test": "vitest run",
"test:watch": "vitest"
```

There is no `test:coverage` script in this repo (a related but different repo, `jireh-core-client`, has one with a broken 90%-threshold gate — do not confuse the two; this repo has neither the script nor the gate).

---

## MSW Is Load-Bearing for the Whole App, Not Just Tests

This is the single most important thing to understand before writing a test here: **this repo has no real backend.** `src/main.tsx` boots MSW (`startMockServiceWorker()`) before rendering `<App />` in *every* environment (dev, build preview, and — via a separate MSW node setup — tests). All data lives in local fixtures (`src/mocks/`) plus `localStorage`/IndexedDB, mutated by MSW request handlers. See `src/mocks/handlers/` for the handler modules (e.g. `misc.ts`) and their co-located `*.test.ts` files for the pattern of testing a handler's behavior directly.

Because of this, testing a component that fetches data usually means either:
1. Letting the real MSW handlers respond (fastest path — the handlers already encode realistic fixture data and stateful mutations), or
2. Overriding a specific handler for one test with `server.use(...)` when you need a specific edge case (error, empty state, slow response).

Do not `vi.mock` the API client to bypass MSW — the handlers are the source of truth for response shape, and bypassing them silently drifts tests from what the mocked "backend" actually returns.

---

## Test File Conventions

Co-located with the code they test — this is followed consistently across the current 137+ test files:

```
src/Routes/Patient/Pages/FastTrack/
├── FastTrackWalletSelection.tsx
├── FastTrackWalletSelection.test.tsx
├── PaymentDetails.tsx
├── PaymentDetails.test.tsx

src/Routes/shell/
├── headers.tsx
├── headers.test.tsx
├── PageHeader.tsx
├── PageHeader.test.tsx
├── StepperHeader.tsx
├── StepperHeader.test.tsx
├── useJourneyStepper.ts
├── useJourneyStepper.test.tsx

src/components/
├── Item.tsx
├── Item.test.tsx
├── ToggleGroup.tsx
├── ToggleGroup.test.tsx
├── form/FormGroupInput.tsx
├── form/FormGroupInput.test.tsx

src/mocks/handlers/
├── misc.ts
├── misc.test.ts
```

---

## Primitive Component Tests (Item / ToggleGroup)

`Item.test.tsx` and `ToggleGroup.test.tsx` (added alongside the primitives themselves) are the reference pattern for testing a new shared primitive in `src/components/`: render each documented composition (e.g. `Item` + `ItemMedia` + `ItemContent` + `ItemTitle`/`ItemDescription`/`ItemActions`), assert the right `data-slot`/`data-variant` attributes and ARIA roles land, and exercise the CVA variant props (`variant`, `size`). When you add a new primitive to `src/components/` (per the "audit before adding" convention), follow this shape rather than only testing the happy-path render.

## Shell / AppShell Test Pattern

`AppShell.test.tsx`, `PageHeader.test.tsx`, `StepperHeader.test.tsx`, `headers.test.tsx`, and `useJourneyStepper.test.tsx` cover the page-shell primitives directly — this is how the AppShell migration (see `architectural-overview.md` / `component-system.md`) was verified screen-by-screen without a full E2E suite. `PatientPageWrapper.test.tsx` specifically covers both the `legacy` and `content` variants (see its `describe('variant="content"und tests")` block) — use it as the template if you're adding a new `PatientPageWrapper` prop.

Because `AppShell` is lint-locked (`no-restricted-imports` in `eslint.config.js`), the allowlist explicitly carves out `**/*.test.{ts,tsx}` so tests can still import and render it directly to exercise the primitive in isolation.

---

## Component Test Pattern

```typescript
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import MyScreen from "./MyScreen"

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe("MyScreen", () => {
  it("renders the expected content", async () => {
    renderWithProviders(<MyScreen />)
    expect(await screen.findByText(/expected copy/i)).toBeInTheDocument()
  })
})
```

Test behaviour and rendered output — not internal implementation. Prefer `findBy*`/`waitFor` over synchronous `getBy*` when the component fetches through MSW (the response is asynchronous even though it's mocked).

---

## What Must Be Tested

For every PR that introduces new code (per CLAUDE.md's "100% test coverage for new code" guardrail — enforced by review, since there's no automated gate):

| Code type | What to test |
|-----------|-------------|
| Utility functions | All branches, edge cases, error cases |
| Custom hooks | Loading state, success state, error state |
| Components | Renders correctly, user interactions, error states, accessibility |
| New shared primitives (`src/components/`) | Every documented composition + CVA variant, per the Item/ToggleGroup pattern above |
| MSW handlers | Request shape, response parsing, stateful mutation behavior (see `misc.test.ts`) |
| Zustand stores | Each action, state transitions, side effects |

---

## What Not to Test

- `src/main.tsx` — bootstrapping/service-worker-purge code, not meaningfully unit-testable
- Third-party SDK initialisation (the mocked SuperTokens recipe, Amplitude if present)
- Tailwind class output — visual regression requires a separate tool (see the `screenshot-app` skill for Playwright-driven visual QA instead)
