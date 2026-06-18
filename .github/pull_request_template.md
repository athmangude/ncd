## What was the issue

<!-- What problem does this PR solve? Link to Linear ticket if applicable. -->

## What changed

<!-- Concrete list of changes. Be specific — files, behaviors, configs. -->

-
-

## Why

<!-- Why this approach? What alternatives did you consider and reject? -->

## Risk / blast radius

<!-- What could break? Which portals (Patient / Org / Guarantor) are affected?
     Any shared components (src/components/) touched? Any service-worker / PWA impact? -->

## Test plan

- [ ] `npm run typecheck` passes
- [ ] `npm run lint:ci` passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke test of affected flow (describe):
- [ ] Tested offline / slow-3G behavior if data-fetching changed
- [ ] Analytics events defined in `src/analytics/events.ts` if new user journey

## Screenshots (UI changes)

<!-- Before / after screenshots for any visual changes. Mobile viewport preferred. -->
