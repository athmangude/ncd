# Deploying the usability-test prototype

This app is a **self-contained prototype**: there is no backend. Every API call is
served from in-browser mock data (Mock Service Worker) and persisted to the
participant's `localStorage`. That means it runs anywhere static files can be
hosted — including GitHub Pages — with no servers, secrets, or environment
variables to configure.

## What the prototype can do

- Run joined flows with consistent state: make a payment → it appears in Payment
  History; pay at a partner hospital → earn 5% cashback and the cashback balance
  updates everywhere; upgrade to Jireh Plus (KES 499) → loans/credit unlock;
  accept a circle invite → the member appears in the network.
- Start every participant from the same fresh seed.
- Let the facilitator reset the account or individual areas, and edit the
  account mid-test (balances, membership, approvals, circle invites).

## Facilitator controls

Open **Profile** (bottom nav → Profile). Two facilitator entries live there:

- **Profile → "Facilitator Tools"** — edit cashback balance, toggle Jireh Plus
  membership, set the credit limit, remove/clear loans, mark circle invites as
  accepted, approve/reject pending payment requests, and reset individual areas.
  Also reachable directly at `…/#/facilitator`.
- **Profile → "Reset to fresh participant"** (under Sign Out) — wipe the current
  participant's data and reseed a clean account. Use this between interviews.

Any edit reloads the app so the change is reflected immediately. Resets are
**manual only** — an accidental page refresh never wipes a participant mid-test.

## One-time setup: a new repo under the Jireh Health org

> Requires org permission to create repos and enable Pages. Run these yourself.

1. **Create the repo** (example name `jireh-ux-prototype`):

   ```bash
   gh repo create Jireh-Health/jireh-ux-prototype --private --source . --remote prototype --push
   ```

   Or create it in the GitHub UI, then:

   ```bash
   git remote add prototype https://github.com/Jireh-Health/jireh-ux-prototype.git
   git push prototype HEAD:main
   ```

2. **Enable GitHub Pages**: in the new repo → **Settings → Pages → Build and
   deployment → Source: GitHub Actions**.

3. **Deploy**: the existing [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
   runs on pushes to `main`/`develop` (and via **Actions → Run workflow**). It
   builds with `VITE_BASE=/<repo-name>/` automatically — no edits needed for a
   different repo name.

4. **Share the URL** with facilitators:

   ```
   https://jireh-health.github.io/jireh-ux-prototype/
   ```

## Notes

- **Hash routing** is used so deep links and refreshes resolve client-side —
  GitHub Pages has no SPA fallback. URLs look like `…/#/patients/...`.
- **Per-device, per-browser state**: data lives in `localStorage`, so each
  participant's browser profile is independent. The facilitator's "Reset"
  button is the clean way to start fresh; clearing site data also works.
- **No keys or env vars** are required for the build — all external services
  (auth, analytics, maps, push) are stubbed at build time.

## Local preview

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve the built app under the configured base path
```
