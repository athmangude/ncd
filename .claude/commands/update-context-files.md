Update the context documentation to reflect changes since the last merged PR on the remote develop branch.

## Steps

### 0. Idempotency check — run this first

Read `context/architecture/.context-version` and get the `last_updated_commit` value.

Run:
```bash
git rev-parse --short HEAD
```

If `last_updated_commit` matches the current HEAD SHA, the context is already up to date. Tell the user:

> Context is already up to date for commit `<SHA>`. Nothing to do.

Then stop — do not proceed.

If they differ, continue to step 1.

---

### 1. Establish the diff base

Run the following in order:

```bash
git fetch origin develop
```

Find the last merge commit on remote develop:
```bash
git log origin/develop --merges -1 --pretty=format:"%H %s"
```

If that returns a SHA, use it as `<base>`. If there are no merge commits (rare), fall back to the common ancestor:
```bash
git merge-base HEAD origin/develop
```

### 2. Get the diff

```bash
git diff <base>..HEAD --name-only
```

If the output is empty (no changes since last merged PR), tell the user the context is already up to date and stop.

Also get a human-readable summary of what changed:
```bash
git log <base>..HEAD --oneline
```

### 3. Map changed files to context docs

Use this table to decide which context docs need updating. Only update docs for areas that have actual changed files — skip everything else.

| Changed files matching... | Update these context docs |
|--------------------------|--------------------------|
| `src/App.tsx`, `src/main.tsx`, `src/RouterWrapper.tsx` | `architectural-overview.md`, `routing.md`, `portal-isolation.md` |
| `src/Routes/` (any), `src/pages/` layout files | `routing.md`, `portal-isolation.md` |
| `src/stores/`, `src/Routes/*/stores/` | `state-management.md` |
| `src/components/` (shared) | `component-system.md` |
| `src/hooks/use*Query*`, `src/hooks/use*Data*`, `*/api.ts`, `*/api/` | `api-layer.md` |
| `src/analytics/`, `src/hooks/useAmplitude*` | `analytics.md` |
| `src/sw.ts`, `vite.config.ts`, `src/hooks/use*Push*`, `src/hooks/use*Offline*` | `pwa-and-offline.md` |
| `src/components/form/`, `src/hooks/usePersistentForm*` | `forms.md` |
| `*.test.ts`, `*.test.tsx`, `vitest.config*` | `testing-strategy.md` |
| `src/pages/patients/loans/`, `src/pages/patients/invoice*` | `loan-application-journey.md` |
| `src/pages/patients/auth/`, `src/pages/patients/onboarding/`, `src/pages/patients/profile/` | `patient-onboarding-journey.md` |
| `src/pages/patients/kyc/`, `src/pages/patients/verification/`, `src/components/SmileId*` | `kyc-verification.md` |
| `src/stores/useFastTrackStore*`, `src/pages/patients/fast-track/` | `fast-track-payment.md` |
| `src/pages/patients/circles/`, `src/pages/patients/network/`, `src/pages/patients/connections/` | `circle-and-network-journeys.md` |
| `src/pages/patients/care-fund/`, `src/pages/patients/cashback/`, `src/pages/patients/rewards/` | `care-fund-journey.md` |
| `src/pages/patients/discovery/`, `src/pages/patients/map/`, `src/hooks/useDiscovery*` | `discovery-and-map.md` |
| `src/context/` (SuperTokens), `src/hooks/useSession*`, `src/hooks/useAuth*` | `authentication.md`, `portal-isolation.md` |

### 4. Update each affected doc

For each context doc identified in step 3:

1. Read the current doc: `context/architecture/<doc>.md`
2. Read the changed source files that map to it (from step 2)
3. Update the doc to accurately reflect the current code — add new patterns, remove outdated ones, update data shapes, correct step sequences
4. Update the frontmatter: `last_updated_commit` to current HEAD SHA, `last_updated_date` to today

### 5. Check for new patterns not yet documented

Review the diff for any of these that don't have a context doc yet:
- A new major page or flow (new route group in `src/pages/`)
- A new Zustand store
- A new shared hook pattern used in 3+ places
- A new analytics event category

If found, create a new `context/architecture/<new-doc>.md` and add it to:
- `context/INDEX.md` under the appropriate section
- The Architecture Context table in `CLAUDE.md`

### 6. Update KNOWN-ISSUES.md and CONFLICTS.md if relevant

- If the diff **fixes** a known issue listed in `context/KNOWN-ISSUES.md`, remove or mark it resolved
- If the diff **introduces** a new confirmed bug or broken flow, add it to `context/KNOWN-ISSUES.md`
- If the diff **resolves** an architectural conflict in `context/CONFLICTS.md`, mark it resolved
- If the diff **introduces** a new architectural ambiguity, add it to `context/CONFLICTS.md`

### 7. Update .context-version

```json
{
  "last_updated_commit": "<current HEAD SHA>",
  "last_updated_date": "<today>",
  "commit_message": "Updated from PR: <last merge commit message>",
  "coverage": ["<all areas now documented>"]
}
```

Get current HEAD SHA: `git rev-parse --short HEAD`

### 8. Report

Output a summary:
- **Base commit:** `<SHA>` — `<merge commit message>`
- **Files changed:** N files across M areas
- **Context docs updated:** list each doc with a one-line note on what changed
- **New docs created:** (if any)
- **Issues/conflicts updated:** (if any)
- **No changes needed:** list any areas that had code changes but context was already accurate

Remind the user to commit the context changes:
```
git add context/ CLAUDE.md && git commit -m "docs: update context to <HEAD SHA>"
```

## Notes

- Only update docs where the code actually changed — don't touch files speculatively
- Never remove documented patterns without confirming they're actually gone from the code (grep first)
- If a changed file maps to multiple docs, update all of them
- The goal is accuracy: the context docs should reflect what the code *does*, not what it *should* do
