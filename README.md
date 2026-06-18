# Jireh Patient Prototype

A **standalone, frontend-only prototype** of the Jireh Health patient app, for
in-person user-testing interviews. It runs entirely in the browser with **no
backend** — all data is served by an in-browser mock API (Mock Service Worker)
from editable JSON fixtures, and user actions persist to `localStorage`.

It was forked from the production `jireh-core-client` and stripped down:

- Patient portal only (Organizations & Guarantor portals removed)
- No SuperTokens, Sentry, Firebase, Amplitude, Paystack, Google Maps, or Mapbox
- Hash routing + a project base path so it deploys cleanly to **GitHub Pages**

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173/
```

On boot you'll see `[MSW] Mocking enabled` in the console. Sign in with **any
phone number** and **any 6-digit OTP** — the first sign-in runs onboarding, and
subsequent sign-ins land on the dashboard.

Other scripts:

```bash
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build locally
npm run test         # run unit tests (incl. mock-API smoke tests)
```

## How the mock layer works

- **`src/mocks/browser.ts`** starts MSW before the app renders (`src/main.tsx`).
- **`src/mocks/handlers/*.ts`** intercept every API call (axios *and* fetch),
  grouped by feature (profile, discovery, loans, onboarding, network, carefund,
  fasttrack, notifications, misc).
- **`src/mocks/fixtures/*.json`** hold the seed data. **Edit these JSON files to
  change what testers see** — facilities, reviews, discounts, loans, network
  members, notifications, the logged-in patient, etc. Changes take effect on the
  next `npm run dev` / `npm run build`.
- **`src/mocks/db.ts`** overlays user-created records (new loans, reviews,
  favorites, onboarding progress) onto the fixtures in `localStorage` so they
  survive reloads.
- **Auth** is faked via local stubs that replace the SuperTokens packages
  (`src/mocks/auth/*`, wired in `vite.config.ts`).

### Resetting state

Clear the `mock:*` and `mock_*` keys in `localStorage` (or use the in-app sign
out, or open a private window) to start fresh from the fixtures.

## Deploy to GitHub Pages

Pushing to `develop` or `main` triggers `.github/workflows/deploy.yml`, which
builds with the correct base path (`/<repo-name>/`) and publishes to Pages.
Enable it once under **Settings → Pages → Source → GitHub Actions**.

To build for a different base manually:

```bash
VITE_BASE=/your-repo-name/ npm run build
```
