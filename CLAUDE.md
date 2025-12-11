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
3. Create React Query hook in `src/hooks/`
4. Use hook in component with proper loading/error states

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
VITE_API_BASE_URL=https://your-cloud-run-service.run.app
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

## Backend Repository
The backend for this frontend is at: https://github.com/patelmm79/dev-nexus

See `docs/` directory for detailed documentation:
- `FRONTEND_SETUP.md` - Complete setup guide
- `FRONTEND_API_CLIENT.md` - API client implementation details
- `FRONTEND_COMPONENTS.md` - Component examples and patterns
