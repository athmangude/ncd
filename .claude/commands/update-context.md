Update the architecture context documentation to reflect the current state of the codebase.

## Steps

1. Read `context/architecture/.context-version` to get the `last_updated_commit` SHA.

2. Run `git log <last_updated_commit>..HEAD --oneline` to see all commits since the last context update. If the output is empty, tell the user the context is already up to date and stop.

3. Run `git diff <last_updated_commit>..HEAD --name-only` to get the list of changed files.

4. Map the changed files to the architecture areas they affect using this guide:
   - `src/App.tsx`, `src/main.tsx` → architectural-overview, authentication, analytics
   - `src/RouterWrapper.tsx`, `src/Routes/*/` → routing
   - `src/Routes/*/stores/` → state-management
   - `src/components/` → component-system
   - `src/hooks/use*Query*`, `src/hooks/use*Data*`, `*/api.ts` → api-layer
   - `src/analytics/` → analytics
   - `src/sw.ts`, `vite.config.ts` (PWA section), `src/hooks/use*Push*`, `src/hooks/use*Offline*` → pwa-and-offline
   - `src/components/form/`, `src/hooks/usePersistentForm*` → forms
   - Any new `*.test.ts` or `*.test.tsx`, `vitest.config*` → testing-strategy

5. For each affected architecture area, read the current `context/architecture/<area>.md` file and read the relevant changed source files from step 4. Then update the doc to reflect what changed — new patterns, removed patterns, changed conventions.

6. Update the frontmatter `last_updated_commit` and `last_updated_date` in each file you modify.

7. Update `context/architecture/.context-version`:
   - Set `last_updated_commit` to the current HEAD SHA (run `git rev-parse --short HEAD`)
   - Set `last_updated_date` to today's date
   - Set `commit_message` to a short summary of what was updated
   - Update `coverage` to include any new areas documented

8. Report a summary of what was updated and what areas were unchanged.

## Notes

- Only update docs for areas with actual changes — don't touch files unnecessarily
- Preserve the existing frontmatter format and section structure
- If a change introduces a new pattern not covered by any existing doc, create a new doc in `context/architecture/` and add it to the overview table in `architectural-overview.md`
- After updating, remind the user to commit the context changes with a message like `docs: update architecture context to <commit SHA>`
