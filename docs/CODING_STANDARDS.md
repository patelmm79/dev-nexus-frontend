Coding Standards — dev-nexus-frontend

Purpose
- Establish practical, enforceable conventions for consistency and fewer integration issues.

TypeScript & Types
- Centralize shared types in `src/types/*` (e.g., `src/types/agents.ts`). Import these types in hooks, services, and components.
- Prefer explicit types over `any`. Use `Record<string, unknown>` or well-defined interfaces for unknown shapes.
- Use `tsc --noEmit` in CI and as a pre-commit check to catch type regressions early.

Project Structure
- `src/services/`: API client(s) only. Keep axios/fetch logic and auth header handling here.
- `src/hooks/`: custom React hooks that wrap `react-query` calls and use shared types.
- `src/components/`: presentational and small stateful components. Group feature components under subfolders (e.g., `components/agents`).
- `src/pages/`: top-level route pages.
- `docs/`: non-code documentation (lessons, deployment notes, integration guides).

React & Hooks
- Use function components + hooks. Avoid class components.
- Keep components focused: separate executor (forms) from result display.
- Use React Query for server state. Keep query keys centralized (constants or functions) to avoid cache mismatch.
- Mutations should provide optimistic updates or invalidate queries on success where appropriate.

Styling & MUI
- Keep MUI versions consistent across `@mui/material` and `@mui/icons-material`.
- Prefer `Box`/flex layouts if Grid typings are problematic with installed MUI versions.
- Use MUI `sx` for local styles when simple; extract shared styles to small helper files if reused.

Imports & Modules
- Avoid duplicate symbol exports. One component per file by default.
- Use absolute/consistent import paths where project config supports them (e.g., `src/` aliases).
- Prefer named exports for components and types; default-export pages/components only when appropriate.

Error Handling & Logging
- Wrap `localStorage` reads/writes in try/catch. Cap stored history size.
- Surface user-friendly errors in UI with MUI `Alert`. Log technical details to console or to a remote error collector.

Security & Secrets
- Never commit secrets. Use environment variables (`.env`, Vite `import.meta.env.VITE_*`) for runtime configuration.
- For protected Vercel deployments, store bypass tokens securely in CI, and never paste tokens into commits or public channels.

Build & Performance
- Run `npm run type-check` and `npm run build` before pushing major changes.
- Monitor `vite build` warnings about large chunks; apply dynamic imports / `build.rollupOptions.output.manualChunks` when needed.

Testing & QA
- Smoke test pages after deployment. For protected deployments, use Vercel bypass token for automated checks.
- Add simple unit tests for complex hooks and slow-evolving logic; integration tests for critical flows if feasible.

Commit & PR Practices
- Small, focused PRs that change one area (types, hook, or component) are easier to review.
- Include a short PR description and list how the change was validated (type-check, build, manual smoke test).

Developer Workflow (recommended)
1. Pull latest main.
2. Run `npm ci` then `npm run type-check`.
3. Implement changes; run `npm run type-check` frequently.
4. Run `npm run build` locally before creating a PR.
5. Deploy to a preview, run smoke tests, then merge.

Formatting & Linting
- Apply `prettier` formatting and a TypeScript linter (e.g., `eslint` with `@typescript-eslint`) in CI.

Accessibility
- Use semantic HTML and MUI components correctly (labels, aria attributes) for accessibility.

Contact & Onboarding Notes
- New contributors should read `docs/LESSONS_LEARNED.md` first to avoid repeating integration pitfalls.

