---
name: screenshot-app
description: Launch the Jireh patient PWA and screenshot one or more routes (mobile + desktop) with Playwright, seeding a fully-onboarded mock profile so authenticated screens render directly. Use to visually QA UI/layout changes (e.g. the AppShell layout migration's per-phase browser QA).
---

# Screenshot the app for visual QA

This app is a **hash-routed React PWA** with an in-browser **MSW mock backend**
(no real API needed). Use this to capture real screenshots when verifying a
visible UI change — the AppShell layout migration in particular requires browser
QA at every visible-change boundary.

## Prerequisites

- `playwright` is a devDependency. If Chromium isn't installed yet:
  `npx playwright install chromium`

## Steps

1. **Start the dev server** (leave it running in the background):

   ```bash
   npm run dev
   ```

   It prints the port. **Gotcha:** if `5173` is already in use it silently moves
   to `5174` (and a stale server may still be serving old code on `5173`). Read
   the printed URL and pass it via `--base` so you screenshot *your* server.

2. **Capture routes** with the committed helper:

   ```bash
   # Mobile (390x844) + desktop (1280x900) for the dashboard and profile tab:
   node scripts/screenshot-routes.mjs /patients,/patients/profile --desktop --base http://localhost:5174

   # Discovery pages:
   node scripts/screenshot-routes.mjs /patients/search,/patients/search/filters,/patients/facility/1,/patients/facility/1/review --base http://localhost:5174
   ```

   PNGs land in `./.screenshots/` (git-ignored). Filenames are derived from the
   route (e.g. `patients-facility-1.png`, `patients-profile-desktop.png`).

   **Git Bash gotcha:** MSYS rewrites a leading-`/` argument into a Windows path
   (`/patients` → `C:/Program Files/Git/patients`), producing garbled filenames
   and routes. Prefix the command with `MSYS_NO_PATHCONV=1` (or run it from
   PowerShell, which doesn't mangle):

   ```bash
   MSYS_NO_PATHCONV=1 node scripts/screenshot-routes.mjs /patients --base http://localhost:5174
   ```

3. **Look at the screenshots** (Read the PNGs). A blank/incomplete frame means
   the app didn't boot or the route didn't render — check the script's console
   output for `[console.error]` lines and the resolved URL.

## How authenticated screens are reached

By default the script injects a fully-onboarded **"Amina"** profile into
`localStorage` before navigating, so the dashboard and other gated routes render
without clicking through onboarding. The injected keys mirror the mock harness:

- `mock:login-details` ← `src/mocks/fixtures/patient-login-details.json`
- `mock:__seed_version__` ← `SEED_VERSION` (read live from `src/mocks/db.ts`, so
  it can't drift and trigger the boot-time wipe)
- `mock_session_exists` / `mock_has_account` / `mock_user_id`

This is more reliable than driving the **Facilitator panel** (`#/facilitator` →
"Load full demo data (Amina)"): that path seeds + reloads, and a stale persisted
onboarding response can leave the app on the mid-onboarding `IncompleteSignUp`
screen.

Pass `--no-seed` to capture pre-auth screens (splash, login, onboarding) as a
brand-new visitor instead.

## Options

`--base <url>` · `--out <dir>` · `--desktop` · `--width <n>` · `--height <n>` ·
`--no-seed` · `--wait <ms>`. See the header of `scripts/screenshot-routes.mjs`.
