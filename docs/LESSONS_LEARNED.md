Lessons Learned — dev-nexus-frontend

Summary
- This project integrated supplier UI components into an existing React + TypeScript Vite app and required careful deduplication and type unification to produce a working production build.

Key Technical Lessons
1. Duplicate source copies cause cascading TypeScript failures
- Multiple component copies (or files containing duplicate implementations) create `Duplicate identifier` and `Duplicate function implementation` TypeScript errors.
- Fix: remove duplicates and keep a single canonical implementation per symbol.

2. Keep shared types in a single module
- Mismatched local type declarations (e.g., `Skill`, `AgentCard`) between `a2aClient` and `useAgents` caused many type errors and query return-type mismatches.
- Fix: add a shared `src/types/*` (or `src/types/agents.ts`) and import from it everywhere.

3. MUI Grid typing is version-sensitive
- Using MUI's older `<Grid item ...>` signatures can clash with installed MUI types. Unstable Grid2 may not be available.
- Fixes: either use `Unstable_Grid2` if present, or prefer a Box/flex layout to avoid typing overloads; ensure the installed `@mui/*` package versions match the code patterns.

4. Imports & icons must match installed packages
- Icon names/exports differ across MUI releases (e.g., `ContentCopy` vs `Copy`) — wrong imports lead to build/type errors.
- Fix: check `@mui/icons-material` exports and import exact named exports.

5. Use a central API client (and keep it typed)
- Centralizing `executeSkill`, `addRepository`, `healthCheckExternal` in `src/services/a2aClient.ts` reduces duplicated axios logic and makes auth header handling consistent.
- Ensure the client exports typed functions so hooks/components can rely on them.

6. React Query usage & side-effects
- Mutations **must** invalidate related queries on success (e.g., patterns, repositories) to keep UI in sync. This is not optional—without invalidation, the UI will show stale data even though the backend has been updated.
- Keep keys consistent and centralized to avoid stale cache issues.
- Use `await` on `invalidateQueries` to ensure completion before proceeding.
- Use `exact: false` when invalidating partial query key matches (e.g., invalidating all pagination variants of a query).
- For better UX, explicitly call `refetchQueries` immediately after invalidation to trigger instant refetch.

7. React Hooks rules—don't call hooks inside loops or conditionals
- Calling hooks (e.g., `useListComponents`, `useQuery`, etc.) inside `.map()` callbacks or conditionals violates React's rules of hooks and causes "too many re-renders" errors.
- Fix: extract the content into a separate component that calls the hook at the component level, then render that component from the map.
- This ensures hooks are called in the same order on every render.

8. Local persistence and limits
- Execution history stored in `localStorage` needs size capping and try/catch to avoid failures in restrictive browsers.

9. Vercel deployment protection can block automated checks
- Protected deployments require a bypass token or SSO redirect; automated smoke tests must use the bypass token URL pattern.
- Store notes about how to obtain and use the bypass token in docs/DEPLOYMENT.md (or use environment-based preview links for CI).

10. Bundle-size awareness
- Vite reported large chunks (>500KB). Consider code-splitting dynamic imports for large feature pages and move rarely-used libs to dynamic import.

Process Lessons
- Make small, atomic edits and re-run `tsc`/`npm run build` frequently to isolate regressions.
- Use the repository search to find duplicate copies before adding supplier components.
- Keep the contributor workflow: run `npm run type-check` and `npm run build` locally before pushing.

Quick checklist for future similar integrations
- Search for duplicate files or overlapping symbols across workspace.
- Create/extend `src/types/*` for shared shapes before writing components.
- Wire a central API client and use it from hooks.
- Run `tsc --noEmit` early and fix errors incrementally.
- Verify MUI package versions and adjust imports/layouts accordingly.
- Check Vercel protection settings before running automated smoke tests.

Appendix
- Files edited during initial integration: `src/hooks/useAgents.ts`, `src/components/agents/*` (SkillCard, SkillExecutor, SkillResultDisplay, RecentActivity), `src/services/a2aClient.ts` (client implementations), `src/pages/Agents.tsx`.
- Files edited for component scanning feature: `src/pages/Repositories.tsx` (extracted RepositoryCard component), `src/components/components/ComponentDetection.tsx` (added component count display), `src/hooks/usePatterns.ts` (fixed useScanComponents mutation with proper query invalidation).
