# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript frontend for the Pattern Discovery Agent System (dev-nexus). The frontend connects to a FastAPI A2A (Agent-to-Agent) backend server to provide visual exploration of code patterns, configuration management, and system monitoring across multiple repositories.

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for API state management
- Material-UI (MUI) for components
- Recharts for data visualization
- react-force-graph-2d for network graphs
- Zustand for client state management
- React Router for routing

**License:** GNU General Public License v3.0

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and update VITE_API_BASE_URL
```

### Development
```bash
# Start development server (http://localhost:5173)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Build & Deploy
```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel

# Deploy to Netlify
netlify deploy --prod
```

## Architecture

### Backend Integration
The frontend communicates with a FastAPI backend via the A2A (Agent-to-Agent) protocol:
- **Backend URL:** Configured via `VITE_API_BASE_URL` environment variable
- **Protocol:** RESTful JSON over HTTPS with CORS
- **Authentication:** Optional Bearer token for protected endpoints
- **Agent Discovery:** `/.well-known/agent.json` provides agent capabilities

### Project Structure
```
src/
├── services/           # API clients and external integrations
│   └── a2aClient.ts   # Main A2A protocol client
├── hooks/             # React Query hooks for data fetching
│   ├── usePatterns.ts
│   ├── useRepositories.ts
│   └── useHealth.ts
├── components/        # Reusable UI components
│   ├── common/       # Generic components (buttons, cards)
│   ├── patterns/     # Pattern visualization components
│   ├── repository/   # Repository-specific components
│   └── layout/       # Layout components (navbar, sidebar)
├── pages/            # Route-level page components
│   ├── Dashboard.tsx
│   ├── Repositories.tsx
│   ├── Patterns.tsx
│   ├── Configuration.tsx
│   ├── Deployment.tsx
│   └── Agents.tsx
├── store/            # Zustand stores for client state
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and utilities
```

### State Management Strategy
- **Server State:** TanStack Query for all API data (patterns, repositories, health)
  - Automatic caching with 5-minute stale time
  - Background refetching on window focus disabled
  - Retry logic configured per query
- **Client State:** Zustand for UI state (theme, sidebar open/closed, filters)
- **URL State:** React Router for navigation and route parameters

### API Client Pattern
All backend communication goes through `src/services/a2aClient.ts`:
- Single axios instance with shared configuration
- Request/response interceptors for auth and error handling
- TypeScript types mirror backend Pydantic models
- Methods correspond to A2A skills (e.g., `query_patterns`, `get_repository_list`)
- **Phase 12:** All responses validated against StandardSkillResponse format
  - `isValidResponse()` - Validate response structure
  - `getExecutionTime()` - Extract execution metrics
  - `getErrorMessage()` - Get error from response
  - `formatResponseLog()` - Format for logging

### Key A2A Skills
The backend exposes these skills via POST `/a2a/execute`:
- `query_patterns` - Get patterns for a repository with keyword filtering
- `get_repository_list` - List all tracked repositories
- `get_deployment_info` - Fetch deployment scripts and lessons learned
- `get_cross_repo_patterns` - Find patterns used across multiple repos
- `health_check_external` - Check status of connected external agents
- `check_documentation_standards` - Validate documentation compliance
- `add_lesson_learned` - Add deployment lessons (requires auth)
- `update_dependency_info` - Update repository dependencies (requires auth)

## Important Patterns

### API Query Hooks
Custom hooks wrap TanStack Query for consistent data fetching:
```typescript
// Example: src/hooks/usePatterns.ts
export function usePatterns(repository: string, keywords?: string[]) {
  return useQuery({
    queryKey: ['patterns', repository, keywords],
    queryFn: () => a2aClient.queryPatterns(repository, keywords),
    enabled: !!repository, // Only fetch when repository is provided
  });
}
```

### Error Handling (Phase 13+)
**All API error handling is automatic via `useApiWithDiagnostics`.**

**What happens automatically:**
- All responses logged to console with `logApiResponse(skillId, response)`
- Response structure validated with `validateApiResponse()`
- User-friendly error messages extracted with `extractErrorMessage()`
- Full diagnostic reports available for debugging

**What you must do in components:**
- **Check all states** before rendering data:
  1. `if (isLoading)` → show spinner
  2. `if (error)` → show error alert (automatically has message)
  3. `if (!data)` → show "no data" warning
  4. `if (!data.success)` → show error from response
  5. Only then access `data.field`
- **Never skip error state checks** - this causes blank screens
- Display errors via `<Alert severity="error">{error.message}</Alert>` or toast

**For UI feedback:**
- Use `react-hot-toast` for transient messages (success, errors from mutations)
- Use MUI `<Alert>` for page-level errors
- Use `<CircularProgress>` for loading states
- Error boundaries wrap page-level components (not data-fetch errors)

### Enum/Union Type Lookups from APIs
When working with TypeScript union types that come from API responses, **always provide fallbacks**:
```typescript
// BAD: Will crash if action_type is not in the config map
const config = actionTypeConfig[action.action_type];
return config.bgColor; // Runtime error if action_type is unexpected

// GOOD: Always has a fallback
const config = actionTypeConfig[action.action_type] || {
  bgColor: '#f5f5f5',
  color: '#666',
  label: 'Unknown Type'
};
return config.bgColor; // Always safe
```
**Why:** TypeScript union types do NOT guarantee the API will only return those values. The backend may add new enum values, have version mismatches, or return unexpected data. Always expect the API to violate its documented contract and handle it gracefully.

### Phase 13+: StandardSkillResponse with Built-In Diagnostics
All A2A skill responses follow the `StandardSkillResponse` format with automatic validation and diagnostics:

**Response structure:**
```typescript
interface StandardSkillResponse {
  success: boolean;           // Always present
  timestamp: string;          // ISO 8601 format, always present
  execution_time_ms: number;  // Always present
  error?: string;             // Only present when success=false
  [key: string]: any;         // Skill-specific fields
}
```

**Built-in automatic handling via `useApiWithDiagnostics`:**
1. **Response logging** - All responses logged to console with skill ID and context
2. **Structure validation** - Checks for required `success`, `timestamp`, `execution_time_ms` fields
3. **Error extraction** - Converts backend errors to user-friendly messages
4. **Diagnostic reports** - Full response details available in console for debugging

**What you do in components:**
```typescript
import { useApiWithDiagnostics } from '../hooks/useApiWithDiagnostics'

const { data, error, isLoading } = useApiWithDiagnostics(
  ['query_patterns', keywords],
  () => a2aClient.queryPatterns(keywords),
  'query_patterns'
);

// Handle all states before accessing data
if (isLoading) return <CircularProgress />;
if (error) return <Alert severity="error">{error.message}</Alert>;
if (!data) return <Alert severity="warning">No data</Alert>;
if (!data.success) return <Alert severity="error">{data.error}</Alert>;

// Now safe to use data fields
return <div>{data.patterns}</div>;
```

**No manual error handling needed** - diagnostics and validation happen automatically in the hook.

### Environment Configuration
Environment variables are accessed via Vite's `import.meta.env`:
- `VITE_API_BASE_URL` - Backend API URL (required)
- `VITE_API_TIMEOUT` - Request timeout in ms (default: 30000)
- `VITE_ENV` - Environment name (development/production)
- Never commit `.env` files - use `.env.example` as template

## Common Tasks

### Adding a New A2A Skill
**IMPORTANT:** Error handling and diagnostics are NOT optional. They are part of the contract. Follow all steps.

1. **Add TypeScript types** to `src/services/a2aClient.ts`
   - Define request and response interfaces
   - Response interface must include optional `error?: string` field
   - All success-only fields should be optional (only available when `success=true`)

2. **Add method to `A2AClient` class**
   - Follow existing patterns for parameter names and input/output types
   - No error handling at this layer—just wrap the API call

3. **Create React Query hook with diagnostics**
   - **ALWAYS use `useApiWithDiagnostics`** (not `useQuery` directly)
   - This provides automatic logging, validation, and error extraction
   ```typescript
   import { useApiWithDiagnostics } from '../hooks/useApiWithDiagnostics'

   export function useMySkill(param: string) {
     return useApiWithDiagnostics(
       ['mySkill', param],
       () => a2aClient.mySkill(param),
       'my_skill_id',
       {
         staleTime: 5 * 60 * 1000, // 5 minutes
         retry: 1,
       }
     );
   }
   ```

4. **Use hook in component with complete error handling**
   - Check `isLoading` → show spinner
   - Check `error` → show error alert with message
   - Check `!data` → show "no data" warning
   - Check `!data.success` → show error from response
   - Only then access data fields

   **Example:**
   ```typescript
   const { data, isLoading, error } = useMySkill(param);

   if (isLoading) return <CircularProgress />;
   if (error) return <Alert severity="error">{error.message}</Alert>;
   if (!data) return <Alert severity="warning">No data returned</Alert>;
   if (!data.success) return <Alert severity="error">{data.error}</Alert>;

   // NOW safe to use data.myField
   return <div>{data.myField}</div>;
   ```

5. **Test error path before merging**
   - Verify backend skill with intentionally broken input
   - Verify error message displays (not blank screen)
   - Check browser console for diagnostic logs from `logApiResponse()`

### Handling Skill Errors
Errors are handled automatically by `useApiWithDiagnostics`:
- All responses logged with `logApiResponse(skillId, response)`
- Structure validated with `validateApiResponse()`
- Error messages extracted with `extractErrorMessage()`
- Full diagnostic report available in browser console

No additional error handling code needed in components beyond the state checks above.

### Adding a New Page
1. Create page component in `src/pages/`
2. Add route to `src/App.tsx` in the `<Routes>` block
3. Add navigation item to `src/components/layout/Layout.tsx`

### Connecting to Local Backend
Update `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8080
```
Ensure backend has CORS configured for `http://localhost:5173`

### Connecting to Production Backend
Update `.env.production`:
```env
VITE_API_BASE_URL=https://pattern-discovery-agent-665374072631.us-central1.run.app
```
Ensure backend CORS includes your Vercel/Netlify domain

## Component Guidelines

### Material-UI Theme
- Theme is configured in `src/App.tsx`
- Supports light/dark mode via `palette.mode`
- Use MUI components for consistency
- Custom theme colors: primary (#1976d2), secondary, success, error, warning, info

### Recharts Visualizations
- Used for bar charts, line charts, and time series
- ResponsiveContainer required for proper sizing
- CartesianGrid, XAxis, YAxis, Tooltip, and Legend are standard components

### Force Graph Network
- `react-force-graph-2d` for pattern relationship visualization
- Nodes represent repositories (blue) and patterns (orange)
- Links show which repositories use which patterns
- Interactive: click nodes for details, drag to rearrange

## Troubleshooting

### Data Not Displaying (Empty Charts/Lists)
**Critical:** When a feature requests data but displays nothing, you MUST verify the actual API response first. Never make educated guesses about data structure.

**Debugging procedure:**
1. Open Browser DevTools (F12) → Network tab
2. Perform the action that triggers the API call
3. Find the request with the relevant `skill_id` in the request body
4. Click the request → Response tab
5. Copy the complete JSON response
6. Open `src/services/a2aClient.ts`
7. Find the TypeScript interface matching your skill (e.g., `GetPatternHealthSummaryResponse`)
8. Compare field names in actual response vs. the interface
9. **If field names don't match:** Update the interface to match reality, not the other way around
10. If transformation is needed (e.g., `week` → `date`), add it in the component with a comment explaining the mismatch

**Why this matters:**
- Defensive code (array checks, try/catch) masks the real problem
- You will waste multiple iterations if you guess instead of verify
- The actual API response is always the source of truth

**Example: WRONG approach**
```typescript
// ❌ Defensive but doesn't fix the root problem
const data = apiResponse.data?.field_name || [];
const transformed = data.map(...); // Still fails if field doesn't exist
```

**Example: RIGHT approach**
```typescript
// ✅ First, verify actual response has this field
// (Check Network tab to confirm the field exists in response)
const patterns = Array.isArray(adoptionData.data?.adoption_timeline)
  ? adoptionData.data.adoption_timeline
  : [];
```

### CORS Errors
If you see "CORS policy: No 'Access-Control-Allow-Origin'" errors:
- Verify backend's `CORS_ORIGINS` environment variable includes your frontend URL
- For local development: `http://localhost:5173`
- For production: Your Vercel/Netlify domain

### API Connection Issues
- Verify `VITE_API_BASE_URL` is correct in `.env`
- Test backend directly: `curl http://localhost:8080/health`
- Check browser Network tab for failed requests
- Ensure backend is running and accessible

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Verify Node.js version compatibility (18+)
- Check all TypeScript types are properly imported

### Type Errors
- All API response types must be defined in `src/services/a2aClient.ts`
- Components should use proper TypeScript interfaces for props
- Enable strict mode in `tsconfig.json` for better type safety

## Lessons Learned

### Response Structure Mismatches (Phase 12)
**Problem:** Backend API responses often don't match TypeScript types, causing empty lists/missing data.

**Example:**
- Frontend expected: `{ patterns: [...], total_patterns: 1 }`
- Backend returned: `{ cross_repo_patterns: [...], total_patterns: 1 }`

**Solution:** Always verify actual API response in Network tab before assuming type structure. Update types to match reality, not the other way around. Add response transformation in API client methods if needed.

**Implementation:** Phase 12 adds `isValidResponse()` validation to catch these mismatches early.

### Async vs. Synchronous Workflows (Phase 11)
**Problem:** Backend suddenly switched from sync to async execution pattern (async_queued), breaking UI assumptions.

**Solution:** Detect execution pattern from response and adapt:
- Check for `state === 'async_queued'` in response
- Use `workflow_id` and polling for async workflows
- Provide manual refresh button (no auto-polling)

**Pattern:** Three-phase flow: Configure → Execute (with polling) → Results

### Error Metadata Importance (Phase 12)
**Problem:** Generic error messages don't help users understand what went wrong.

**Solution:** Backend includes error metadata (`error_type`, `error_code`, `error_subtype`) that frontend can map to user-friendly messages.

**Pattern:** Use `handleSkillError()` to convert backend errors to structured errors with severity levels and retry logic.

### Performance Monitoring at Scale
**Problem:** With 43+ A2A skills, hard to identify which ones are slow or failing.

**Solution:** Phase 12 `useExecutionMetrics()` hook automatically tracks execution times and success rates per skill.

**Pattern:** `recordMetric()` after every skill execution to build performance profile over time.

### Type Safety with API Contracts
**Problem:** TypeScript can't validate API responses at runtime.

**Solution:** Phase 12 standardizes all responses to `StandardSkillResponse` with mandatory fields: `success`, `timestamp`, `execution_time_ms`

**Pattern:** Always validate responses before using. Use `a2aClient.isValidResponse()` to catch malformed responses early.

### Error Handling & Diagnostics Must Be Built-In (Phase 13+)
**Problem:** Black screens when API fails; no visibility into what went wrong. Developers resort to console.log debugging after-the-fact.

**Root Cause:** Error handling was added reactively after failures, not proactively as a foundation layer.

**Example Failures:**
- Complexity analysis feature called non-existent `get_complexity_analysis` skill
- Backend skill `get_repository_complexity_details` had a StandardSkillResponse initialization bug
- Users saw blank screens instead of actionable error messages

**Solution:** Establish error handling as a first-class concern, not a patch:
1. **Create diagnostic utilities** (`src/utils/apiDiagnostics.ts`):
   - `logApiResponse()` - Log all responses with context
   - `validateApiResponse()` - Check StandardSkillResponse structure
   - `extractErrorMessage()` - User-friendly error text
   - `createApiErrorReport()` - Detailed diagnostics for debugging

2. **Create diagnostic hooks** (`src/hooks/useApiWithDiagnostics.ts`):
   - Wraps `useQuery` with automatic logging, validation, error extraction
   - Applies diagnostics to every API call consistently
   - No more manual error handling in each component

3. **Apply to all data-fetching hooks**:
   ```typescript
   // OLD (error-prone)
   const { data, error } = useQuery({
     queryKey: ['skill', params],
     queryFn: () => a2aClient.someSkill(params),
   });

   // NEW (with diagnostics)
   const { data, error } = useApiWithDiagnostics(
     ['skill', params],
     () => a2aClient.someSkill(params),
     'skill_id'
   );
   ```

4. **Ensure visible error states**:
   - Every page checks for `isLoading`, `error`, and `!data` states
   - Users always see a message, never a blank screen
   - Error messages include backend details (see ComplexityDashboard for example)

**Key Principle:** If an API call can fail (and they all can), the error path must be as fully implemented as the happy path. Error handling is not optional polish—it's part of the contract.

**Future Tasks:**
- Migrate all data-fetching hooks to use `useApiWithDiagnostics`
- Add error boundaries for page-level failures
- Create consistent error display patterns (Snackbar for transient, Alert for page-level)

## Backend Repository
The backend for this frontend is at: https://github.com/patelmm79/dev-nexus

See `docs/` directory for detailed documentation:
- `FRONTEND_SETUP.md` - Complete setup guide
- `FRONTEND_API_CLIENT.md` - API client implementation details
- `FRONTEND_COMPONENTS.md` - Component examples and patterns
- `FRONTEND_IMPLEMENTATION_GUIDE.md` - Phase-by-phase implementation guide (Phases 3-12)
