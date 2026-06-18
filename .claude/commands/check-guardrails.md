Run a pre-ship guardrails check on the current working changes. Report a go/no-go checklist.

## Steps

1. **Identify changed files**
   Run `git diff --name-only HEAD` (staged + unstaged) and `git diff --name-only main...HEAD` (commits on branch). Collect all `.ts` and `.tsx` files that were added or modified.

2. **Type safety check**
   Run `npx tsc --noEmit`. Report any type errors as blockers.

3. **Lint check**
   Run `npm run lint`. Report any lint errors as blockers. Lint warnings are advisory.

4. **Build check**
   Run `npm run build`. A failing build is a hard blocker.

5. **Shared component impact**
   Check if any changed files are in `src/components/`. If so:
   - Run `grep -r "from.*@/components/<ComponentName>" src/ --include="*.tsx" --include="*.ts"` for each modified component to count callers
   - If a component with >3 callers was modified, flag it as high-risk and list the callers
   - Check for removed or renamed props that could silently break callers

6. **Test coverage**
   For each changed `.ts` / `.tsx` source file (excluding `*.test.*`, `*.d.ts`, `src/main.tsx`, `src/sw.ts`):
   - Check if a corresponding `.test.ts` or `.test.tsx` file exists in the same directory
   - List any changed source files with no test file as a blocker

7. **Analytics coverage**
   If any new page components or user flows were added (files in `src/Routes/*/Pages/`):
   - Check that `src/analytics/events.ts` was also modified (new event constants defined)
   - If a new page exists without new events, flag it as advisory

8. **`any` type audit**
   Run `git diff HEAD | grep "^+" | grep ": any"` to find new `any` type annotations in the diff. Flag each one as advisory (not a hard blocker, but note them).

9. **Environment variable check**
   Scan changed files for hardcoded URLs (strings matching `https?://`) or hardcoded secrets patterns. Flag any found as a hard blocker.

## Output Format

Report the results as a checklist:

```
PRE-SHIP GUARDRAILS CHECK
=========================

BLOCKERS (must fix before merging):
  [ ] TypeScript — N errors found
  [ ] Build — failed
  [ ] Lint — N errors found
  [ ] Missing tests — [list files]
  [ ] Hardcoded URL/secret — [list locations]

WARNINGS (advisory, review before merging):
  [ ] High-risk shared component change — [component name, N callers]
  [ ] New page without analytics events — [page name]
  [ ] New `any` type annotations — [list locations]

STATUS: GO / NO-GO
```

A "GO" requires zero blockers. Warnings do not block merging but should be acknowledged.
