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

### Error Handling
- API errors are caught by axios interceptors
- User-facing errors displayed via react-hot-toast
- Loading states shown with MUI CircularProgress or Skeleton components
- Error boundaries should wrap page-level components
- **Phase 12:** Structured error handling with metadata extraction
  - Use `handleSkillError()` to convert responses to user-friendly errors
  - Check `isRetryable()` to determine if error can be retried
  - Access error metadata for debugging: `error.errorType`, `error.errorCode`
  - Use `getRetryDelay()` for exponential backoff logic

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

### Phase 12: Response Validation & Error Handling
All A2A skill responses follow the StandardSkillResponse format with automatic validation:

**Using Phase 12 utilities in components:**
```typescript
import { useSkillExecution } from '../hooks/useSkillExecutionPhase12'
import { useExecutionMetrics } from '../hooks/useExecutionMetrics'
import { handleSkillError } from '../utils/skillErrorHandler'

// Execute skill with automatic validation and metrics
const { data, error, executionTime, execute, isSuccess } = useSkillExecution()
const { recordMetric, getMetrics } = useExecutionMetrics()

const handleSearch = async (keywords: string[]) => {
  const response = await execute('query_patterns', { keywords })

  if (response) {
    recordMetric(response, 'query_patterns')

    if (isSuccess) {
      // Access skill-specific fields from standardized response
      const patterns = response.patterns // Type-safe access
      console.log(`Executed in ${executionTime}ms`)
    }
  }
}

// Handle errors with user-friendly messages
if (error && data) {
  const structuredError = handleSkillError(data, 'query_patterns')
  showUserMessage(structuredError.userMessage)  // User-friendly
  logError(structuredError)  // Log for debugging

  if (isRetryable(structuredError)) {
    setTimeout(() => handleSearch(keywords), getRetryDelay(structuredError))
  }
}
```

**Response Validation Pattern:**
- All responses checked for: `success` (boolean), `timestamp` (ISO 8601), `execution_time_ms` (number)
- Use `a2aClient.isValidResponse()` to validate response structure
- Invalid responses fail gracefully with console warnings
- Error responses must have `error` field when `success=false`

**Error Metadata:**
- Backend provides error details in response metadata: `error_type`, `error_code`, `error_subtype`
- Frontend maps error types to user-friendly messages
- Severity levels: INFO, WARNING, ERROR, CRITICAL
- Retry logic with exponential backoff for retryable errors

### Environment Configuration
Environment variables are accessed via Vite's `import.meta.env`:
- `VITE_API_BASE_URL` - Backend API URL (required)
- `VITE_API_TIMEOUT` - Request timeout in ms (default: 30000)
- `VITE_ENV` - Environment name (development/production)
- Never commit `.env` files - use `.env.example` as template

## Common Tasks

### Adding a New A2A Skill
1. Add TypeScript types to `src/services/a2aClient.ts`
2. Add method to `A2AClient` class
3. Create React Query hook in `src/hooks/` OR use `useSkillExecution` for direct calls
4. Use hook in component with proper loading/error states
5. **Phase 12:** All responses automatically validated and can use error handling utilities

### Handling Skill Errors with Phase 12
When a skill execution fails:
```typescript
import { useSkillExecution } from '../hooks/useSkillExecutionPhase12'
import { handleSkillError, isRetryable, getRetryDelay } from '../utils/skillErrorHandler'

const { data, error, execute } = useSkillExecution()

const response = await execute('query_patterns', { keywords })

if (error && data && !data.success) {
  const structuredError = handleSkillError(data, 'query_patterns')

  // Show user-friendly message
  toast.error(structuredError.userMessage)

  // Log for debugging
  console.error(structuredError)

  // Retry if appropriate
  if (isRetryable(structuredError)) {
    const delay = getRetryDelay(structuredError)
    setTimeout(() => execute('query_patterns', { keywords }), delay)
  }
}
```

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

## Backend Repository
The backend for this frontend is at: https://github.com/patelmm79/dev-nexus

See `docs/` directory for detailed documentation:
- `FRONTEND_SETUP.md` - Complete setup guide
- `FRONTEND_API_CLIENT.md` - API client implementation details
- `FRONTEND_COMPONENTS.md` - Component examples and patterns
- `FRONTEND_IMPLEMENTATION_GUIDE.md` - Phase-by-phase implementation guide (Phases 3-12)
