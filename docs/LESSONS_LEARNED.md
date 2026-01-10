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
- **Critical:** TypeScript response types must match the actual backend response field names exactly. Mismatches (e.g., `total` vs `total_count`) cause silent failures where code accesses undefined fields, defaulting to 0.
- Always verify API response shape matches types before deploying. Use backend documentation or inspect actual API responses in Network tab.

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

8. Backend operations that change state should log activity events
- Skills that modify state (e.g., `scan_repository_components`, `add_lesson_learned`) should automatically log activity events.
- The frontend can invalidate and refetch data, but users expect to see audit trails in recent activity feeds.
- Ensure backend logs events with timestamps and details whenever significant operations complete.
- Without activity logging, users can't verify when operations occurred or track system changes over time.

9. Local persistence and limits
- Execution history stored in `localStorage` needs size capping and try/catch to avoid failures in restrictive browsers.

10. Vercel deployment protection can block automated checks
- Protected deployments require a bypass token or SSO redirect; automated smoke tests must use the bypass token URL pattern.
- Store notes about how to obtain and use the bypass token in docs/DEPLOYMENT.md (or use environment-based preview links for CI).

11. Bundle-size awareness
- Vite reported large chunks (>500KB). Consider code-splitting dynamic imports for large feature pages and move rarely-used libs to dynamic import.

12. API contract verification is mandatory—never make educated guesses
- **Root cause of failures:** Assuming TypeScript types are correct without verifying them against actual API responses.
- **Real example:** Pattern health analytics expected `pattern_scores` and `issue_breakdown`, but API actually returned `patterns_by_health` and `top_issue_types`. Expected field `health_trends[].date` but API returned `health_trends[].week`. Charts silently failed to render because code was accessing undefined fields that defaulted to `undefined`.
- **Why it happened:** Trusted existing TypeScript interfaces without checking. Made defensive assumptions (added array checks, fallbacks) instead of verifying the actual data contract first. Made educated guesses that things were correct because documentation said they were.
- **Correct debugging procedure when features don't display data:**
  1. Open Browser DevTools → Network tab
  2. Find the API request (search for `skill_id` in request)
  3. Click on request → Response tab
  4. Copy the complete JSON response
  5. Compare field names against TypeScript interface in `src/services/a2aClient.ts`
  6. If field names differ, update the interface immediately
  7. Transform data in component if needed (e.g., `week` → `date`)
  8. Never assume types are correct
  9. Never make educated guesses about API structure
- **Why this matters:**
  - Defensive code (array checks, fallbacks) masks the real problem
  - Wasted 3+ iterations fixing symptoms instead of the root cause
  - Should be caught in the first debugging attempt if you verify the response
- **Prevention:**
  - Add JSDoc examples with actual API response JSON to every API client method
  - Document exact field names and types returned by backend
  - When backend API changes, TypeScript interfaces MUST be updated simultaneously
  - Code review must include verification that types match actual responses
- **Key principle:** The actual API response is the source of truth. If it differs from TypeScript types, the types are wrong—not the API. Never trust code or documentation over the actual running API response.

13. Always provide fallbacks for union type values from APIs
- TypeScript union types (e.g., `action_type: 'analysis' | 'lesson' | 'deployment' | 'runtime_issue'`) do NOT guarantee the API will only return those values.
- The backend may add new enum values, return unexpected data due to bugs, or have version mismatches.
- Code that directly accesses config maps keyed by union types without fallbacks will crash at runtime:
  ```typescript
  // BAD - crashes if action_type is not in actionTypeConfig
  const config = actionTypeConfig[action.action_type];
  return config.bgColor;  // "Cannot read properties of undefined (reading 'bgColor')"

  // GOOD - provides sensible fallback
  const config = actionTypeConfig[action.action_type] || {
    bgColor: '#f5f5f5',
    color: '#666',
    icon: <DefaultIcon />,
    label: 'Unknown Type',
  };
  return config.bgColor;  // Always safe
  ```
- Even if TypeScript is satisfied with the types, always add fallbacks for enum/union type lookups from external APIs.
- This is defensive programming: expect the API to violate its documented contract and handle it gracefully.

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
